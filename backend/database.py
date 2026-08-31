"""
Camada de banco de dados SQLite do Ciber Quest.
Schema simples com FK e índices para queries do ranking e do admin.
"""
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

from . import config


SCHEMA = """
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
    senha_hash TEXT NOT NULL,
    papel TEXT NOT NULL DEFAULT 'usuario' CHECK (papel IN ('usuario','admin')),
    ativo INTEGER NOT NULL DEFAULT 1,
    criado_em TEXT NOT NULL,
    ultimo_login TEXT
);

CREATE TABLE IF NOT EXISTS missoes_completadas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    missao_id TEXT NOT NULL,
    acertos INTEGER NOT NULL,
    total INTEGER NOT NULL,
    xp INTEGER NOT NULL,
    streak_max INTEGER NOT NULL DEFAULT 0,
    completada_em TEXT NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    missao_id TEXT NOT NULL,
    conquistada_em TEXT NOT NULL,
    UNIQUE(usuario_id, missao_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessoes (
    token TEXT PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    criada_em TEXT NOT NULL,
    expira_em TEXT NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tentativas_login (
    ip TEXT NOT NULL,
    tentativa_em TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_missoes_usuario ON missoes_completadas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_badges_usuario ON badges(usuario_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_usuario ON sessoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_tentativas_ip ON tentativas_login(ip);
"""


def agora_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _dict_factory(cursor, row):
    return {col[0]: row[idx] for idx, col in enumerate(cursor.description)}


def conectar() -> sqlite3.Connection:
    Path(config.DB_PATH).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(config.DB_PATH)
    conn.row_factory = _dict_factory
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn


@contextmanager
def transacao():
    """Gerenciador de contexto para transações com commit/rollback automáticos."""
    conn = conectar()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def inicializar():
    """Cria tabelas se não existirem."""
    with transacao() as conn:
        conn.executescript(SCHEMA)


# ---------- Operações de usuários ----------

def usuario_por_email(conn: sqlite3.Connection, email: str):
    row = conn.execute(
        "SELECT * FROM usuarios WHERE email = ? COLLATE NOCASE",
        (email.strip().lower(),),
    ).fetchone()
    return row


def usuario_por_id(conn: sqlite3.Connection, uid: int):
    return conn.execute("SELECT * FROM usuarios WHERE id = ?", (uid,)).fetchone()


def criar_usuario(conn: sqlite3.Connection, nome: str, email: str, senha_hash: str, papel: str = "usuario") -> int:
    cur = conn.execute(
        """
        INSERT INTO usuarios (nome, email, senha_hash, papel, ativo, criado_em)
        VALUES (?, ?, ?, ?, 1, ?)
        """,
        (nome.strip(), email.strip().lower(), senha_hash, papel, agora_iso()),
    )
    return cur.lastrowid


def atualizar_ultimo_login(conn: sqlite3.Connection, uid: int):
    conn.execute("UPDATE usuarios SET ultimo_login = ? WHERE id = ?", (agora_iso(), uid))


def listar_usuarios(conn: sqlite3.Connection):
    """
    Lista todos os usuários com XP total e nº de missões completas.
    """
    return conn.execute("""
        SELECT
            u.id, u.nome, u.email, u.papel, u.ativo, u.criado_em, u.ultimo_login,
            COALESCE(SUM(mc.xp), 0) AS xp_total,
            COUNT(DISTINCT mc.missao_id) AS missoes_completas,
            (SELECT COUNT(*) FROM badges b WHERE b.usuario_id = u.id) AS badges
        FROM usuarios u
        LEFT JOIN missoes_completadas mc ON mc.usuario_id = u.id
        GROUP BY u.id
        ORDER BY u.criado_em DESC
    """).fetchall()


def atualizar_usuario(conn: sqlite3.Connection, uid: int, **campos):
    """
    Atualiza campos permitidos: nome, email, papel, ativo, senha_hash.
    """
    permitidos = {"nome", "email", "papel", "ativo", "senha_hash"}
    campos_ok = {k: v for k, v in campos.items() if k in permitidos and v is not None}
    if not campos_ok:
        return 0
    if "email" in campos_ok:
        campos_ok["email"] = campos_ok["email"].strip().lower()
    if "nome" in campos_ok:
        campos_ok["nome"] = campos_ok["nome"].strip()
    set_clause = ", ".join(f"{k} = ?" for k in campos_ok)
    values = list(campos_ok.values()) + [uid]
    cur = conn.execute(f"UPDATE usuarios SET {set_clause} WHERE id = ?", values)
    return cur.rowcount


def deletar_usuario(conn: sqlite3.Connection, uid: int):
    conn.execute("DELETE FROM usuarios WHERE id = ?", (uid,))


def zerar_pontuacao_usuario(conn: sqlite3.Connection, uid: int):
    conn.execute("DELETE FROM missoes_completadas WHERE usuario_id = ?", (uid,))
    conn.execute("DELETE FROM badges WHERE usuario_id = ?", (uid,))


# ---------- Missões / progresso ----------

def registrar_missao(conn: sqlite3.Connection, uid: int, missao_id: str,
                     acertos: int, total: int, xp: int, streak_max: int):
    """Registra sempre — histórico completo."""
    conn.execute(
        """
        INSERT INTO missoes_completadas (usuario_id, missao_id, acertos, total, xp, streak_max, completada_em)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (uid, missao_id, acertos, total, xp, streak_max, agora_iso()),
    )


def melhor_por_missao(conn: sqlite3.Connection, uid: int):
    """Retorna, para cada missao_id, o registro com maior xp do usuário."""
    return conn.execute("""
        SELECT missao_id, MAX(acertos) AS acertos, total, MAX(xp) AS xp_max, MAX(streak_max) AS streak_max
        FROM missoes_completadas
        WHERE usuario_id = ?
        GROUP BY missao_id
    """, (uid,)).fetchall()


def historico_usuario(conn: sqlite3.Connection, uid: int, limite: int = 100):
    return conn.execute("""
        SELECT missao_id, acertos, total, xp, streak_max, completada_em
        FROM missoes_completadas
        WHERE usuario_id = ?
        ORDER BY completada_em DESC
        LIMIT ?
    """, (uid, limite)).fetchall()


def xp_total_usuario(conn: sqlite3.Connection, uid: int) -> int:
    row = conn.execute(
        "SELECT COALESCE(SUM(xp), 0) AS total FROM missoes_completadas WHERE usuario_id = ?",
        (uid,),
    ).fetchone()
    return int(row["total"] or 0)


# ---------- Badges ----------

def conceder_badge(conn: sqlite3.Connection, uid: int, missao_id: str) -> bool:
    """Retorna True se a badge foi concedida agora (não existia antes)."""
    try:
        conn.execute(
            "INSERT INTO badges (usuario_id, missao_id, conquistada_em) VALUES (?, ?, ?)",
            (uid, missao_id, agora_iso()),
        )
        return True
    except sqlite3.IntegrityError:
        return False


def badges_do_usuario(conn: sqlite3.Connection, uid: int):
    return conn.execute(
        "SELECT missao_id, conquistada_em FROM badges WHERE usuario_id = ?",
        (uid,),
    ).fetchall()


# ---------- Ranking ----------

def ranking_top(conn: sqlite3.Connection, limite: int = 100):
    return conn.execute("""
        SELECT
            u.id, u.nome,
            COALESCE(SUM(mc.xp), 0) AS xp_total,
            COUNT(DISTINCT mc.missao_id) AS missoes_completas,
            (SELECT COUNT(*) FROM badges b WHERE b.usuario_id = u.id) AS badges
        FROM usuarios u
        LEFT JOIN missoes_completadas mc ON mc.usuario_id = u.id
        WHERE u.ativo = 1
        GROUP BY u.id
        HAVING xp_total > 0
        ORDER BY xp_total DESC, missoes_completas DESC, u.nome ASC
        LIMIT ?
    """, (limite,)).fetchall()


# ---------- Sessões ----------

def criar_sessao(conn: sqlite3.Connection, token: str, uid: int, expira_em: str):
    conn.execute(
        "INSERT INTO sessoes (token, usuario_id, criada_em, expira_em) VALUES (?, ?, ?, ?)",
        (token, uid, agora_iso(), expira_em),
    )


def sessao_por_token(conn: sqlite3.Connection, token: str):
    return conn.execute(
        """
        SELECT s.token, s.usuario_id, s.expira_em, u.nome, u.email, u.papel, u.ativo
        FROM sessoes s
        JOIN usuarios u ON u.id = s.usuario_id
        WHERE s.token = ?
        """,
        (token,),
    ).fetchone()


def apagar_sessao(conn: sqlite3.Connection, token: str):
    conn.execute("DELETE FROM sessoes WHERE token = ?", (token,))


def limpar_sessoes_expiradas(conn: sqlite3.Connection):
    conn.execute("DELETE FROM sessoes WHERE expira_em < ?", (agora_iso(),))


# ---------- Estatísticas admin ----------

def estatisticas_gerais(conn: sqlite3.Connection):
    total_usuarios = conn.execute(
        "SELECT COUNT(*) AS n FROM usuarios WHERE ativo = 1"
    ).fetchone()["n"]
    total_partidas = conn.execute(
        "SELECT COUNT(*) AS n FROM missoes_completadas"
    ).fetchone()["n"]
    total_xp = conn.execute(
        "SELECT COALESCE(SUM(xp), 0) AS n FROM missoes_completadas"
    ).fetchone()["n"]
    total_badges = conn.execute("SELECT COUNT(*) AS n FROM badges").fetchone()["n"]

    por_missao = conn.execute("""
        SELECT
            missao_id,
            COUNT(*) AS partidas,
            AVG(1.0 * acertos / NULLIF(total, 0)) AS taxa_acerto_media,
            AVG(xp) AS xp_medio
        FROM missoes_completadas
        GROUP BY missao_id
        ORDER BY partidas DESC
    """).fetchall()

    return {
        "total_usuarios": total_usuarios,
        "total_partidas": total_partidas,
        "total_xp": total_xp,
        "total_badges": total_badges,
        "por_missao": por_missao,
    }


# ---------- Rate limit de login ----------

def registrar_tentativa_login(conn: sqlite3.Connection, ip: str):
    conn.execute(
        "INSERT INTO tentativas_login (ip, tentativa_em) VALUES (?, ?)",
        (ip, agora_iso()),
    )


def tentativas_recentes(conn: sqlite3.Connection, ip: str, minutos: int) -> int:
    from datetime import timedelta
    limite = (datetime.now(timezone.utc) - timedelta(minutes=minutos)).isoformat()
    row = conn.execute(
        "SELECT COUNT(*) AS n FROM tentativas_login WHERE ip = ? AND tentativa_em > ?",
        (ip, limite),
    ).fetchone()
    return int(row["n"] or 0)


def limpar_tentativas_antigas(conn: sqlite3.Connection, horas: int = 24):
    from datetime import timedelta
    limite = (datetime.now(timezone.utc) - timedelta(hours=horas)).isoformat()
    conn.execute("DELETE FROM tentativas_login WHERE tentativa_em < ?", (limite,))
