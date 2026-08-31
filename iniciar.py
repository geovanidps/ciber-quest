"""
Ciber Quest — script de conveniência para iniciar o servidor.

Uso:
    python iniciar.py                    # sobe o servidor na porta 5000
    python iniciar.py --port 8080        # porta alternativa
    python iniciar.py --debug            # modo debug
    python iniciar.py criar-admin        # cria admin interativamente

Variáveis de ambiente relevantes:
    CIBER_QUEST_HOST, CIBER_QUEST_PORT, CIBER_QUEST_DEBUG
    CIBER_QUEST_ADMIN_NOME, CIBER_QUEST_ADMIN_EMAIL, CIBER_QUEST_ADMIN_SENHA
    CIBER_QUEST_DB, CIBER_QUEST_SESSAO_HORAS
"""
import argparse
import getpass
import os
import sys
from pathlib import Path

# Torna o pacote 'backend' importável quando executado direto
sys.path.insert(0, str(Path(__file__).resolve().parent))

from backend import app as app_module
from backend import auth, config
from backend import database as db


def cmd_servir(args):
    if args.port:
        os.environ["CIBER_QUEST_PORT"] = str(args.port)
        config.PORT = args.port
    if args.host:
        os.environ["CIBER_QUEST_HOST"] = args.host
        config.HOST = args.host
    if args.debug:
        os.environ["CIBER_QUEST_DEBUG"] = "1"
        config.DEBUG = True

    criado = app_module.preparar()
    if criado:
        print("=" * 60)
        print(" ADMIN INICIAL CRIADO ")
        print("=" * 60)
        print(f"  E-mail: {config.ADMIN_INICIAL_EMAIL}")
        print(f"  Senha:  {config.ADMIN_INICIAL_SENHA}")
        print("  Troque a senha em /admin depois do primeiro login.")
        print("=" * 60)

    print()
    print(f"Ciber Quest rodando em http://{config.HOST}:{config.PORT}")
    print(f"  Frontend do jogador: http://localhost:{config.PORT}/")
    print(f"  Painel admin:        http://localhost:{config.PORT}/admin")
    print(f"  Banco de dados:      {config.DB_PATH}")
    print()
    app_module.app.run(host=config.HOST, port=config.PORT, debug=config.DEBUG)


def cmd_criar_admin(_args):
    """Cria um admin interativamente."""
    db.inicializar()
    print("Criando novo administrador\n")
    nome = input("Nome: ").strip()
    email = input("E-mail: ").strip().lower()
    while True:
        senha = getpass.getpass("Senha (mín 6): ")
        confirmar = getpass.getpass("Confirmar: ")
        if senha != confirmar:
            print("Senhas não conferem.\n")
            continue
        if len(senha) < 6:
            print("Senha muito curta.\n")
            continue
        break

    with db.transacao() as conn:
        if db.usuario_por_email(conn, email):
            print("Já existe usuário com esse e-mail.")
            sys.exit(1)
        senha_hash = auth.hash_senha(senha)
        uid = db.criar_usuario(conn, nome, email, senha_hash, papel="admin")
    print(f"OK — admin criado (id {uid}).")


def main():
    parser = argparse.ArgumentParser(description="Ciber Quest — servidor")
    sub = parser.add_subparsers(dest="cmd")

    parser.add_argument("--host", help="Host (padrão 0.0.0.0)")
    parser.add_argument("--port", type=int, help="Porta (padrão 5000)")
    parser.add_argument("--debug", action="store_true", help="Modo debug")

    sub.add_parser("criar-admin", help="Criar um administrador interativamente")

    args = parser.parse_args()
    if args.cmd == "criar-admin":
        cmd_criar_admin(args)
    else:
        cmd_servir(args)


if __name__ == "__main__":
    main()
