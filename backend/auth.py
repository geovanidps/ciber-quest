"""
Autenticação do Ciber Quest.

- Hash de senha com PBKDF2-HMAC-SHA256 (biblioteca padrão, sem dependências)
- Tokens de sessão = uuid4 armazenados no banco
- Decorators requer_login e requer_admin
"""
import base64
import hashlib
import hmac
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from functools import wraps

from flask import g, jsonify, request

from . import config, database as db


# =========================================================
# Senhas
# =========================================================

def hash_senha(senha: str) -> str:
    """
    Retorna 'pbkdf2_sha256$iter$salt_b64$hash_b64'.
    """
    if not senha or len(senha) < 6:
        raise ValueError("A senha precisa ter pelo menos 6 caracteres.")
    salt = os.urandom(16)
    derivada = hashlib.pbkdf2_hmac(
        "sha256", senha.encode("utf-8"), salt, config.PBKDF2_ITER
    )
    return "pbkdf2_sha256${it}${salt}${hash}".format(
        it=config.PBKDF2_ITER,
        salt=base64.b64encode(salt).decode("ascii"),
        hash=base64.b64encode(derivada).decode("ascii"),
    )


def verificar_senha(senha: str, senha_hash: str) -> bool:
    try:
        algo, iter_str, salt_b64, hash_b64 = senha_hash.split("$")
        if algo != "pbkdf2_sha256":
            return False
        it = int(iter_str)
        salt = base64.b64decode(salt_b64)
        esperado = base64.b64decode(hash_b64)
        candidato = hashlib.pbkdf2_hmac("sha256", senha.encode("utf-8"), salt, it)
        return hmac.compare_digest(candidato, esperado)
    except Exception:
        return False


# =========================================================
# Tokens / sessões
# =========================================================

def novo_token() -> str:
    return uuid.uuid4().hex + secrets.token_hex(16)


def criar_sessao_para(uid: int) -> tuple[str, str]:
    """Cria sessão e retorna (token, expira_em_iso)."""
    token = novo_token()
    expira = (datetime.now(timezone.utc) + timedelta(hours=config.SESSAO_HORAS)).isoformat()
    with db.transacao() as conn:
        db.criar_sessao(conn, token, uid, expira)
        db.limpar_sessoes_expiradas(conn)
    return token, expira


def token_do_request():
    """Extrai token do header Authorization: Bearer <token>."""
    auth = request.headers.get("Authorization", "")
    if auth.lower().startswith("bearer "):
        return auth[7:].strip()
    return None


def usuario_do_request():
    """Se o token é válido, retorna o dict de usuário/sessão. Senão None."""
    token = token_do_request()
    if not token:
        return None
    with db.transacao() as conn:
        sess = db.sessao_por_token(conn, token)
        if not sess:
            return None
        # Verifica expiração
        expira = datetime.fromisoformat(sess["expira_em"])
        if expira < datetime.now(timezone.utc):
            db.apagar_sessao(conn, token)
            return None
        if not sess["ativo"]:
            return None
        return sess


# =========================================================
# Decorators
# =========================================================

def requer_login(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        sess = usuario_do_request()
        if not sess:
            return jsonify({"erro": "Não autenticado"}), 401
        g.sessao = sess
        return func(*args, **kwargs)
    return wrapper


def requer_admin(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        sess = usuario_do_request()
        if not sess:
            return jsonify({"erro": "Não autenticado"}), 401
        if sess["papel"] != "admin":
            return jsonify({"erro": "Requer privilégio de administrador"}), 403
        g.sessao = sess
        return func(*args, **kwargs)
    return wrapper
