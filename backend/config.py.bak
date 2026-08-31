"""
Configurações do Ciber Quest.
Lê variáveis de ambiente com defaults sensatos para uso local.
"""
import os
from pathlib import Path

# Diretório base do projeto (backend/ → sobe 1 nível)
BASE_DIR = Path(__file__).resolve().parent.parent

# Banco de dados SQLite
DB_PATH = os.environ.get(
    "CIBER_QUEST_DB",
    str(BASE_DIR / "backend" / "ciber_quest.db")
)

# Diretório do frontend (arquivos estáticos)
FRONTEND_DIR = BASE_DIR / "frontend"

# Servidor
HOST = os.environ.get("CIBER_QUEST_HOST", "0.0.0.0")
PORT = int(os.environ.get("CIBER_QUEST_PORT", "5000"))
DEBUG = os.environ.get("CIBER_QUEST_DEBUG", "0") == "1"

# Autenticação
# Duração de uma sessão em horas
SESSAO_HORAS = int(os.environ.get("CIBER_QUEST_SESSAO_HORAS", "12"))
# Iterações do PBKDF2 (aumentar melhora segurança, custa CPU no login)
PBKDF2_ITER = int(os.environ.get("CIBER_QUEST_PBKDF2_ITER", "200000"))

# Admin inicial (criado apenas se não existir nenhum admin no banco)
ADMIN_INICIAL_NOME = os.environ.get("CIBER_QUEST_ADMIN_NOME", "Administrador")
ADMIN_INICIAL_EMAIL = os.environ.get("CIBER_QUEST_ADMIN_EMAIL", "admin@ciberquest.local")
ADMIN_INICIAL_SENHA = os.environ.get("CIBER_QUEST_ADMIN_SENHA", "admin123")

# Rate limit simples: máximo de tentativas de login por IP em uma janela
LOGIN_MAX_TENTATIVAS = 10
LOGIN_JANELA_MINUTOS = 5
