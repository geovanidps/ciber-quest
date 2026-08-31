"""
Ciber Quest — servidor Flask
Serve o frontend estático e expõe API para autenticação, jogo e admin.
"""
import csv
import io
from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory, g, Response

from . import auth, config, database as db


# =========================================================
# App / rotas do frontend
# =========================================================

app = Flask(
    __name__,
    static_folder=str(config.FRONTEND_DIR),
    static_url_path="",
)


@app.route("/")
def index():
    return send_from_directory(config.FRONTEND_DIR, "index.html")


@app.route("/admin")
@app.route("/admin.html")
def admin_page():
    return send_from_directory(config.FRONTEND_DIR, "admin.html")


# CORS simples (útil quando o frontend é aberto em outra origem em dev)
@app.after_request
def cors(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, DELETE, OPTIONS"
    return resp


@app.route("/api/<path:_any>", methods=["OPTIONS"])
def cors_preflight(_any):
    return ("", 204)


# =========================================================
# Helpers
# =========================================================

def _payload():
    data = request.get_json(silent=True) or {}
    if not isinstance(data, dict):
        return {}
    return data


def _valida_email(email: str) -> bool:
    if not email or "@" not in email:
        return False
    partes = email.split("@")
    return len(partes) == 2 and all(partes) and "." in partes[1]


def _ip_do_request() -> str:
    xff = request.headers.get("X-Forwarded-For", "")
    if xff:
        return xff.split(",")[0].strip()
    return request.remote_addr or "0.0.0.0"


def _usuario_publico(row) -> dict:
    """Serializa usuário sem campos sensíveis."""
    return {
        "id": row["id"],
        "nome": row["nome"],
        "email": row["email"],
        "papel": row["papel"],
        "ativo": bool(row["ativo"]),
        "criado_em": row["criado_em"],
        "ultimo_login": row.get("ultimo_login") if isinstance(row, dict) else row["ultimo_login"],
    }


# =========================================================
# Auth: registrar / login / logout / eu
# =========================================================

@app.post("/api/registrar")
def registrar():
    data = _payload()
    nome = (data.get("nome") or "").strip()
    email = (data.get("email") or "").strip().lower()
    senha = data.get("senha") or ""

    if len(nome) < 2:
        return jsonify({"erro": "Nome deve ter pelo menos 2 caracteres"}), 400
    if not _valida_email(email):
        return jsonify({"erro": "E-mail inválido"}), 400
    if len(senha) < 6:
        return jsonify({"erro": "Senha deve ter pelo menos 6 caracteres"}), 400

    try:
        senha_hash = auth.hash_senha(senha)
    except ValueError as e:
        return jsonify({"erro": str(e)}), 400

    with db.transacao() as conn:
        if db.usuario_por_email(conn, email):
            return jsonify({"erro": "E-mail já cadastrado"}), 409
        uid = db.criar_usuario(conn, nome, email, senha_hash, papel="usuario")
        db.atualizar_ultimo_login(conn, uid)
        usuario = db.usuario_por_id(conn, uid)

    token, expira = auth.criar_sessao_para(uid)
    return jsonify({
        "token": token,
        "expira_em": expira,
        "usuario": _usuario_publico(usuario),
    }), 201


@app.post("/api/login")
def login():
    data = _payload()
    email = (data.get("email") or "").strip().lower()
    senha = data.get("senha") or ""
    ip = _ip_do_request()

    # Rate limit
    with db.transacao() as conn:
        db.limpar_tentativas_antigas(conn)
        n = db.tentativas_recentes(conn, ip, config.LOGIN_JANELA_MINUTOS)
    if n >= config.LOGIN_MAX_TENTATIVAS:
        return jsonify({
            "erro": f"Muitas tentativas. Aguarde {config.LOGIN_JANELA_MINUTOS} minutos."
        }), 429

    if not email or not senha:
        return jsonify({"erro": "E-mail e senha obrigatórios"}), 400

    with db.transacao() as conn:
        usuario = db.usuario_por_email(conn, email)
        if not usuario or not usuario["ativo"] or not auth.verificar_senha(senha, usuario["senha_hash"]):
            db.registrar_tentativa_login(conn, ip)
            return jsonify({"erro": "Credenciais inválidas"}), 401
        db.atualizar_ultimo_login(conn, usuario["id"])

    token, expira = auth.criar_sessao_para(usuario["id"])
    return jsonify({
        "token": token,
        "expira_em": expira,
        "usuario": _usuario_publico(usuario),
    })


@app.post("/api/logout")
@auth.requer_login
def logout():
    token = auth.token_do_request()
    with db.transacao() as conn:
        db.apagar_sessao(conn, token)
    return jsonify({"ok": True})


@app.get("/api/eu")
@auth.requer_login
def eu():
    uid = g.sessao["usuario_id"]
    with db.transacao() as conn:
        usuario = db.usuario_por_id(conn, uid)
        xp = db.xp_total_usuario(conn, uid)
        melhores = db.melhor_por_missao(conn, uid)
        badges = db.badges_do_usuario(conn, uid)
    return jsonify({
        "usuario": _usuario_publico(usuario),
        "xp_total": xp,
        "missoes": melhores,
        "badges": [b["missao_id"] for b in badges],
    })


# =========================================================
# Jogo: registrar resultado
# =========================================================

@app.post("/api/completar-missao")
@auth.requer_login
def completar_missao():
    data = _payload()
    missao_id = (data.get("missao_id") or "").strip()
    try:
        acertos = int(data.get("acertos", 0))
        total = int(data.get("total", 0))
        xp = int(data.get("xp", 0))
        streak_max = int(data.get("streak_max", 0))
    except (TypeError, ValueError):
        return jsonify({"erro": "Campos numéricos inválidos"}), 400

    if not missao_id or total <= 0 or acertos < 0 or acertos > total or xp < 0:
        return jsonify({"erro": "Dados inválidos"}), 400

    # Teto de XP defensivo contra manipulação no cliente
    xp_teto = total * 300
    if xp > xp_teto:
        xp = xp_teto

    uid = g.sessao["usuario_id"]
    proporcao = acertos / total
    ganhou_badge = False

    with db.transacao() as conn:
        db.registrar_missao(conn, uid, missao_id, acertos, total, xp, streak_max)
        if proporcao >= 0.7:
            ganhou_badge = db.conceder_badge(conn, uid, missao_id)
        xp_total = db.xp_total_usuario(conn, uid)

    return jsonify({
        "ok": True,
        "xp_total": xp_total,
        "badge_nova": ganhou_badge,
    })


# =========================================================
# Ranking
# =========================================================

@app.get("/api/ranking")
@auth.requer_login
def ranking():
    with db.transacao() as conn:
        top = db.ranking_top(conn, 100)
    return jsonify({"top": top})


# =========================================================
# Admin
# =========================================================

@app.get("/api/admin/usuarios")
@auth.requer_admin
def admin_listar_usuarios():
    with db.transacao() as conn:
        usuarios = db.listar_usuarios(conn)
    for u in usuarios:
        u.pop("senha_hash", None)
        u["ativo"] = bool(u["ativo"])
    return jsonify({"usuarios": usuarios})


@app.post("/api/admin/usuarios")
@auth.requer_admin
def admin_criar_usuario():
    data = _payload()
    nome = (data.get("nome") or "").strip()
    email = (data.get("email") or "").strip().lower()
    senha = data.get("senha") or ""
    papel = data.get("papel") or "usuario"

    if papel not in ("usuario", "admin"):
        return jsonify({"erro": "papel deve ser 'usuario' ou 'admin'"}), 400
    if len(nome) < 2:
        return jsonify({"erro": "Nome inválido"}), 400
    if not _valida_email(email):
        return jsonify({"erro": "E-mail inválido"}), 400
    if len(senha) < 6:
        return jsonify({"erro": "Senha deve ter pelo menos 6 caracteres"}), 400

    try:
        senha_hash = auth.hash_senha(senha)
    except ValueError as e:
        return jsonify({"erro": str(e)}), 400

    with db.transacao() as conn:
        if db.usuario_por_email(conn, email):
            return jsonify({"erro": "E-mail já cadastrado"}), 409
        uid = db.criar_usuario(conn, nome, email, senha_hash, papel=papel)
        usuario = db.usuario_por_id(conn, uid)
    return jsonify({"usuario": _usuario_publico(usuario)}), 201


@app.patch("/api/admin/usuarios/<int:uid>")
@auth.requer_admin
def admin_editar_usuario(uid):
    data = _payload()
    campos = {}
    if "nome" in data:
        campos["nome"] = data["nome"]
    if "email" in data:
        if not _valida_email(data["email"]):
            return jsonify({"erro": "E-mail inválido"}), 400
        campos["email"] = data["email"]
    if "papel" in data:
        if data["papel"] not in ("usuario", "admin"):
            return jsonify({"erro": "papel inválido"}), 400
        campos["papel"] = data["papel"]
    if "ativo" in data:
        campos["ativo"] = 1 if data["ativo"] else 0
    if "senha" in data and data["senha"]:
        if len(data["senha"]) < 6:
            return jsonify({"erro": "Senha deve ter pelo menos 6 caracteres"}), 400
        campos["senha_hash"] = auth.hash_senha(data["senha"])

    if not campos:
        return jsonify({"erro": "Nada para atualizar"}), 400

    with db.transacao() as conn:
        alvo = db.usuario_por_id(conn, uid)
        if not alvo:
            return jsonify({"erro": "Usuário não encontrado"}), 404
        # Impede rebaixamento do último admin ativo
        if campos.get("papel") == "usuario" and alvo["papel"] == "admin":
            admins = conn.execute(
                "SELECT COUNT(*) AS n FROM usuarios WHERE papel = 'admin' AND ativo = 1"
            ).fetchone()["n"]
            if admins <= 1:
                return jsonify({"erro": "Não é possível rebaixar o único administrador ativo"}), 400
        db.atualizar_usuario(conn, uid, **campos)
        usuario = db.usuario_por_id(conn, uid)
    return jsonify({"usuario": _usuario_publico(usuario)})


@app.delete("/api/admin/usuarios/<int:uid>")
@auth.requer_admin
def admin_deletar_usuario(uid):
    if uid == g.sessao["usuario_id"]:
        return jsonify({"erro": "Você não pode excluir a si mesmo"}), 400
    with db.transacao() as conn:
        alvo = db.usuario_por_id(conn, uid)
        if not alvo:
            return jsonify({"erro": "Usuário não encontrado"}), 404
        if alvo["papel"] == "admin":
            admins = conn.execute(
                "SELECT COUNT(*) AS n FROM usuarios WHERE papel = 'admin' AND ativo = 1"
            ).fetchone()["n"]
            if admins <= 1:
                return jsonify({"erro": "Não é possível excluir o único administrador ativo"}), 400
        db.deletar_usuario(conn, uid)
    return jsonify({"ok": True})


@app.get("/api/admin/usuarios/<int:uid>/historico")
@auth.requer_admin
def admin_historico_usuario(uid):
    with db.transacao() as conn:
        alvo = db.usuario_por_id(conn, uid)
        if not alvo:
            return jsonify({"erro": "Usuário não encontrado"}), 404
        historico = db.historico_usuario(conn, uid, limite=500)
        badges = db.badges_do_usuario(conn, uid)
        xp_total = db.xp_total_usuario(conn, uid)
    return jsonify({
        "usuario": _usuario_publico(alvo),
        "xp_total": xp_total,
        "historico": historico,
        "badges": [b["missao_id"] for b in badges],
    })


@app.post("/api/admin/usuarios/<int:uid>/zerar")
@auth.requer_admin
def admin_zerar_usuario(uid):
    with db.transacao() as conn:
        alvo = db.usuario_por_id(conn, uid)
        if not alvo:
            return jsonify({"erro": "Usuário não encontrado"}), 404
        db.zerar_pontuacao_usuario(conn, uid)
    return jsonify({"ok": True})


@app.get("/api/admin/estatisticas")
@auth.requer_admin
def admin_estatisticas():
    with db.transacao() as conn:
        stats = db.estatisticas_gerais(conn)
    return jsonify(stats)


@app.get("/api/admin/relatorio.csv")
@auth.requer_admin
def admin_relatorio_csv():
    with db.transacao() as conn:
        usuarios = db.listar_usuarios(conn)

    saida = io.StringIO()
    writer = csv.writer(saida, delimiter=";")
    writer.writerow([
        "ID", "Nome", "Email", "Papel", "Ativo",
        "Criado em", "Ultimo login",
        "XP total", "Missoes completas", "Badges",
    ])
    for u in usuarios:
        writer.writerow([
            u["id"], u["nome"], u["email"], u["papel"],
            "Sim" if u["ativo"] else "Nao",
            u["criado_em"] or "",
            u["ultimo_login"] or "",
            u["xp_total"], u["missoes_completas"], u["badges"],
        ])

    resp = Response(saida.getvalue(), mimetype="text/csv; charset=utf-8")
    data = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    resp.headers["Content-Disposition"] = f'attachment; filename="ciber-quest-usuarios-{data}.csv"'
    return resp


# =========================================================
# Ping (health check)
# =========================================================

@app.get("/api/ping")
def ping():
    return jsonify({"ok": True, "quando": datetime.now(timezone.utc).isoformat()})


# =========================================================
# Inicialização — pode ser chamada por iniciar.py
# =========================================================

def criar_admin_inicial():
    """Cria o admin default se não houver nenhum admin no banco."""
    with db.transacao() as conn:
        existe = conn.execute(
            "SELECT COUNT(*) AS n FROM usuarios WHERE papel = 'admin'"
        ).fetchone()["n"]
        if existe > 0:
            return False
        senha_hash = auth.hash_senha(config.ADMIN_INICIAL_SENHA)
        db.criar_usuario(
            conn,
            config.ADMIN_INICIAL_NOME,
            config.ADMIN_INICIAL_EMAIL,
            senha_hash,
            papel="admin",
        )
    return True


def preparar():
    db.inicializar()
    criado = criar_admin_inicial()
    return criado


if __name__ == "__main__":
    preparar()
    app.run(host=config.HOST, port=config.PORT, debug=config.DEBUG)
