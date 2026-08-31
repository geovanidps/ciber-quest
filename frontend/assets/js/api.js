/* ============================================================
   CIBER QUEST — Cliente HTTP para a API do backend
   ------------------------------------------------------------
   Gerencia token de sessão no localStorage e injeta no header.
   ============================================================ */

const API = (function () {
  "use strict";

  const CHAVE_TOKEN = "ciber-quest:token";
  const CHAVE_USUARIO = "ciber-quest:usuario";

  function baseUrl() {
    return "";
  }

  function getToken() {
    return localStorage.getItem(CHAVE_TOKEN);
  }

  function setSessao(token, usuario) {
    localStorage.setItem(CHAVE_TOKEN, token);
    localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
  }

  function getUsuario() {
    try {
      const raw = localStorage.getItem(CHAVE_USUARIO);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function limparSessao() {
    localStorage.removeItem(CHAVE_TOKEN);
    localStorage.removeItem(CHAVE_USUARIO);
  }

  async function request(metodo, caminho, body) {
    const headers = { "Content-Type": "application/json" };
    const token = getToken();
    if (token) headers["Authorization"] = "Bearer " + token;

    const opts = { method: metodo, headers };
    if (body !== undefined) opts.body = JSON.stringify(body);

    let resp;
    try {
      resp = await fetch(baseUrl() + caminho, opts);
    } catch (e) {
      throw new Error("Sem conexão com o servidor. Verifique se o backend está rodando.");
    }

    // 401 → sessão inválida
    if (resp.status === 401 && caminho !== "/api/login" && caminho !== "/api/registrar") {
      limparSessao();
      if (window.CiberQuest && window.CiberQuest.aoDeslogar) {
        window.CiberQuest.aoDeslogar();
      }
    }

    let dados = null;
    const contentType = resp.headers.get("Content-Type") || "";
    if (contentType.includes("application/json")) {
      dados = await resp.json();
    } else {
      dados = await resp.text();
    }

    if (!resp.ok) {
      const msg = (dados && dados.erro) || `Erro ${resp.status}`;
      const err = new Error(msg);
      err.status = resp.status;
      err.dados = dados;
      throw err;
    }
    return dados;
  }

  return {
    getToken,
    getUsuario,
    setSessao,
    limparSessao,
    estaLogado: () => !!getToken(),
    ehAdmin: () => {
      const u = getUsuario();
      return u && u.papel === "admin";
    },

    registrar: (nome, email, senha) => request("POST", "/api/registrar", { nome, email, senha }),
    login: (email, senha) => request("POST", "/api/login", { email, senha }),
    logout: () => request("POST", "/api/logout"),
    eu: () => request("GET", "/api/eu"),

    completarMissao: (missao_id, acertos, total, xp, streak_max) =>
      request("POST", "/api/completar-missao", { missao_id, acertos, total, xp, streak_max }),
    ranking: () => request("GET", "/api/ranking"),

    admin: {
      listarUsuarios: () => request("GET", "/api/admin/usuarios"),
      criarUsuario: (dados) => request("POST", "/api/admin/usuarios", dados),
      editarUsuario: (id, dados) => request("PATCH", "/api/admin/usuarios/" + id, dados),
      excluirUsuario: (id) => request("DELETE", "/api/admin/usuarios/" + id),
      historico: (id) => request("GET", "/api/admin/usuarios/" + id + "/historico"),
      zerarUsuario: (id) => request("POST", "/api/admin/usuarios/" + id + "/zerar"),
      estatisticas: () => request("GET", "/api/admin/estatisticas"),
      urlRelatorioCsv: () => baseUrl() + "/api/admin/relatorio.csv",
    },
  };
})();

window.API = API;
