# 🛡️ Ciber Quest — Full-stack

Aplicação web **gamificada** de conscientização em segurança da informação, com:

- Sistema de **cadastro e login** (múltiplos usuários no mesmo servidor)
- **Ranking global top 100** compartilhado em tempo real
- **Painel administrativo** com CRUD de usuários, estatísticas e relatórios CSV
- **Trocar de usuário** (logout) sem apagar dados

Baseado em ISO 27001:2022 (A.6 People Controls), NIST SP 800-50 Rev.1, ENISA e LGPD.

---

## 🏗️ Arquitetura

- **Backend**: Python + Flask + SQLite (banco de dados local em arquivo)
- **Frontend**: HTML + CSS + JavaScript puros (sem framework, sem build)
- **Autenticação**: PBKDF2-HMAC-SHA256 + tokens de sessão (Bearer)
- **Zero dependências externas** além do Flask

Toda persistência é local — o banco `ciber_quest.db` fica em `backend/`.

---

## 🚀 Como rodar

### 1. Instalar dependências

Precisa de **Python 3.10+** instalado.

```powershell
cd experimentos\ciber-quest
pip install -r backend\requirements.txt
```

### 2. Subir o servidor

```powershell
python iniciar.py
```

Saída esperada na primeira vez:

```
============================================================
 ADMIN INICIAL CRIADO 
============================================================
  E-mail: admin@ciberquest.local
  Senha:  xxxxxx
  Troque a senha em /admin depois do primeiro login.
============================================================

Ciber Quest rodando em http://0.0.0.0:5000
  Frontend do jogador: http://localhost:5000/
  Painel admin:        http://localhost:5000/admin
  Banco de dados:      .../backend/ciber_quest.db
```

### 3. Acessar

- **Jogadores**: `http://localhost:5000/`
- **Admin**: `http://localhost:5000/admin`

Login inicial: `admin@ciberquest.local` / `admin123` — troque no painel.

### Compartilhar com a rede local (opcional)

O servidor sobe em `0.0.0.0`, então outras máquinas na mesma rede podem acessar via seu IP:

```powershell
# Descobrir seu IP local
ipconfig
```

Depois compartilhe algo como `http://192.168.1.42:5000/`.

---

## ⚙️ Configuração (variáveis de ambiente)

Todas opcionais — usam defaults sensatos.

| Variável | Default | O que faz |
|---|---|---|
| `CIBER_QUEST_HOST` | `0.0.0.0` | Interface de escuta |
| `CIBER_QUEST_PORT` | `5000` | Porta |
| `CIBER_QUEST_DEBUG` | `0` | Debug mode do Flask |
| `CIBER_QUEST_DB` | `backend/ciber_quest.db` | Caminho do SQLite |
| `CIBER_QUEST_SESSAO_HORAS` | `12` | Duração de uma sessão |
| `CIBER_QUEST_ADMIN_NOME` | `Administrador` | Nome do admin inicial |
| `CIBER_QUEST_ADMIN_EMAIL` | `admin@ciberquest.local` | E-mail do admin inicial |
| `CIBER_QUEST_ADMIN_SENHA` | `admin123` | Senha do admin inicial |

O admin inicial só é criado **se não houver nenhum admin no banco**. Ou seja, dá para trocar as credenciais antes do primeiro start:

```powershell
$env:CIBER_QUEST_ADMIN_SENHA = "senha-forte-aqui"
python iniciar.py
```

### Criar admin adicional pela CLI

```powershell
python iniciar.py criar-admin
```

Vai pedir nome, e-mail e senha interativamente.

---

## 🎮 Funcionalidades do jogador

- Cadastro com nome, e-mail e senha (mínimo 6 caracteres)
- Login e logout (botão "Sair" no topo)
- 7 missões temáticas com 30 cenários reais
- XP, 6 níveis progressivos e 7 medalhas
- Sequências (streak) com bônus de XP
- **Ranking global** top 100 (destaque para sua posição)
- **Perfil** com progresso por missão
- Feedback imediato com explicação didática após cada resposta

## ⚙️ Funcionalidades do administrador

- **Dashboard**: total de usuários, partidas, XP acumulado, medalhas, desempenho por missão
- **CRUD de usuários**: criar / editar / promover a admin / ativar / desativar / excluir
- **Zerar pontuação** de qualquer usuário (mantém a conta)
- **Ver histórico** completo (últimas 500 partidas) de qualquer usuário
- **Exportar CSV** com todos os usuários e suas métricas
- Buscar usuário por nome ou e-mail
- **Proteções**: não é possível excluir/rebaixar o único admin ativo, nem excluir a si mesmo

Acesse `/admin` com uma conta que tenha papel `admin`.

---

## 🗂️ Estrutura do projeto

```
ciber-quest/
├── backend/
│   ├── __init__.py
│   ├── app.py              # Rotas Flask (auth + jogo + admin)
│   ├── auth.py             # Hash PBKDF2, tokens, decorators
│   ├── config.py           # Configurações (env vars)
│   ├── database.py         # Schema SQLite + operações
│   ├── requirements.txt    # flask
│   └── ciber_quest.db      # (gerado no primeiro run)
├── frontend/
│   ├── index.html          # Jogador (login, cadastro, jogo, ranking, perfil)
│   ├── admin.html          # Painel admin (dashboard + CRUD)
│   └── assets/
│       ├── css/style.css
│       └── js/
│           ├── api.js       # Cliente HTTP + token
│           ├── questions.js # Banco de perguntas
│           ├── game.js      # Lógica do jogador
│           └── admin.js     # Lógica do admin
├── iniciar.py               # Ponto de entrada
└── README.md
```

---

## 🔒 Segurança

- Senhas em **PBKDF2-HMAC-SHA256** com 200.000 iterações + salt aleatório de 16 bytes
- Tokens de sessão (uuid4 + 32 bytes aleatórios) com expiração configurável
- **Rate limit** no login (10 tentativas por IP em 5 minutos)
- **Teto de XP por missão** no servidor para evitar manipulação do cliente
- Bloqueios: não excluir/rebaixar o único admin ativo, não excluir a si mesmo

**Limitações conhecidas** (por ser um app educacional/local):

- SQLite não é o ideal para muitos escrita simultâneas — funciona bem até dezenas de usuários simultâneos
- Não há CSRF token (para uso local em rede confiável)
- Não há HTTPS por padrão — se for expor externamente, use nginx/traefik como reverse proxy com TLS
- Sessão em Bearer token no localStorage é vulnerável a XSS; o frontend usa `textContent` em vez de `innerHTML` sempre que possível para mitigar

---

## 📚 Referências de conteúdo

- **ISO/IEC 27001:2022** — Anexo A, A.6 (People Controls). [Advisera guide](https://advisera.com/iso27001/annex-a-controls/)
- **NIST SP 800-50 Rev.1** (setembro/2024) — *Building a Cybersecurity and Privacy Learning Program*. [NIST CSRC](https://csrc.nist.gov/pubs/sp/800/50/r1/final)
- **NIST SP 800-63B** — *Digital Identity Guidelines* (senhas, MFA)
- **ENISA AR-in-a-Box** — [Kit oficial](https://www.enisa.europa.eu/topics/awareness-and-cyber-hygiene/ar-in-a-box)
- **LGPD** — Lei 13.709/2018
- **CERT.br** — Cartilha de Segurança para Internet

---

## 🔗 Endpoints da API

Base: `http://localhost:5000/api`

### Público
- `POST /registrar` — `{nome, email, senha}` → `{token, usuario}`
- `POST /login` — `{email, senha}` → `{token, usuario}`
- `GET /ping` — health check

### Autenticado (header `Authorization: Bearer <token>`)
- `GET /eu` — dados + XP total + missões + badges
- `POST /logout`
- `POST /completar-missao` — `{missao_id, acertos, total, xp, streak_max}`
- `GET /ranking` — top 100

### Admin (papel=admin)
- `GET /admin/usuarios` — lista todos com métricas
- `POST /admin/usuarios` — criar
- `PATCH /admin/usuarios/{id}` — editar (nome, email, papel, ativo, senha)
- `DELETE /admin/usuarios/{id}` — excluir
- `GET /admin/usuarios/{id}/historico` — histórico + badges
- `POST /admin/usuarios/{id}/zerar` — apaga pontuação
- `GET /admin/estatisticas` — dashboard
- `GET /admin/relatorio.csv` — download CSV

---

## 🐛 Troubleshooting

### "ModuleNotFoundError: No module named 'flask'"
Instale as dependências: `pip install -r backend/requirements.txt`

### "address already in use" na porta 5000
Alguma outra coisa está usando a 5000. Rode em outra porta: `python iniciar.py --port 8080`

### Esqueci a senha do admin
Delete o `backend/ciber_quest.db` para começar do zero, ou crie um novo admin via CLI:
```powershell
python iniciar.py criar-admin
```
Depois entre com o novo admin e edite ou exclua os antigos.

### Quero resetar tudo
Pare o servidor (Ctrl+C) e delete `backend/ciber_quest.db`. Ao subir de novo, o admin inicial é recriado.

---

## 📝 Licença

Livre para uso educacional. Créditos são bem-vindos.
