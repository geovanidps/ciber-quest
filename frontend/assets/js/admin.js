/* ============================================================
   CIBER QUEST — Painel administrativo (frontend)
   ============================================================ */

(function () {
  "use strict";

  const estado = { usuarios: [], filtro: "", modoEdicao: false, editandoId: null };

  const missaoMap = {};
  window.MISSOES.forEach(m => { missaoMap[m.id] = m; });

  function escapar(t) {
    const div = document.createElement("div");
    div.textContent = t == null ? "" : String(t);
    return div.innerHTML;
  }

  function formatarData(iso) {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } catch (e) { return iso; }
  }

  function mostrar(id) { document.getElementById(id).classList.remove("oculto"); }
  function esconder(id) { document.getElementById(id).classList.add("oculto"); }

  async function verificarAcesso() {
    if (!API.estaLogado()) {
      document.getElementById("mensagem-negado").textContent = "Você precisa fazer login primeiro.";
      return false;
    }
    try {
      const dados = await API.eu();
      if (dados.usuario.papel !== "admin") {
        document.getElementById("mensagem-negado").textContent = "Esta área é exclusiva para administradores.";
        return false;
      }
      document.getElementById("admin-nome").textContent = dados.usuario.nome + " · " + dados.usuario.email;
      return true;
    } catch (e) {
      document.getElementById("mensagem-negado").textContent = "Sessão expirada. Faça login novamente.";
      return false;
    }
  }

  async function carregarDashboard() {
    try {
      const stats = await API.admin.estatisticas();
      const cards = document.getElementById("stats-cards");
      cards.innerHTML = `
        <div class="stat-card"><div class="titulo">Usuários</div><div class="valor">${stats.total_usuarios}</div><div class="subvalor">ativos</div></div>
        <div class="stat-card"><div class="titulo">Partidas</div><div class="valor">${stats.total_partidas}</div><div class="subvalor">total</div></div>
        <div class="stat-card"><div class="titulo">XP acumulado</div><div class="valor">${stats.total_xp}</div><div class="subvalor">soma da comunidade</div></div>
        <div class="stat-card"><div class="titulo">Medalhas</div><div class="valor">${stats.total_badges}</div><div class="subvalor">conquistadas</div></div>
      `;
      const tbody = document.getElementById("tabela-missoes-stats");
      if (!stats.por_missao || stats.por_missao.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:24px; color:var(--texto-suave);">Nenhuma partida registrada ainda.</td></tr>`;
      } else {
        tbody.innerHTML = "";
        stats.por_missao.forEach(m => {
          const missao = missaoMap[m.missao_id];
          const nome = missao ? `${missao.icone} ${escapar(missao.titulo)}` : escapar(m.missao_id);
          const taxa = m.taxa_acerto_media != null ? (m.taxa_acerto_media * 100).toFixed(1) + "%" : "—";
          const xpMedio = m.xp_medio != null ? Math.round(m.xp_medio) : "—";
          const tr = document.createElement("tr");
          tr.innerHTML = `<td>${nome}</td><td>${m.partidas}</td><td>${taxa}</td><td>${xpMedio}</td>`;
          tbody.appendChild(tr);
        });
      }
    } catch (e) { alert("Falha ao carregar dashboard: " + e.message); }
  }

  async function carregarUsuarios() {
    try {
      const dados = await API.admin.listarUsuarios();
      estado.usuarios = dados.usuarios || [];
      renderizarUsuarios();
    } catch (e) { alert("Falha ao carregar usuários: " + e.message); }
  }

  function renderizarUsuarios() {
    const tbody = document.getElementById("tabela-usuarios");
    const filtro = (estado.filtro || "").trim().toLowerCase();
    const lista = filtro
      ? estado.usuarios.filter(u => u.nome.toLowerCase().includes(filtro) || u.email.toLowerCase().includes(filtro))
      : estado.usuarios;

    if (lista.length === 0) {
      tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:24px; color:var(--texto-suave);">Nenhum usuário encontrado.</td></tr>`;
      return;
    }
    tbody.innerHTML = "";
    const meuId = (API.getUsuario() || {}).id;

    lista.forEach(u => {
      const tr = document.createElement("tr");
      const souEu = u.id === meuId;
      tr.innerHTML = `
        <td>${u.id}</td>
        <td>${escapar(u.nome)}${souEu ? " <em style='color:var(--texto-suave)'>(você)</em>" : ""}</td>
        <td>${escapar(u.email)}</td>
        <td><span class="selo-papel ${u.papel}">${u.papel === "admin" ? "Admin" : "Usuário"}</span></td>
        <td><span class="selo-status ${u.ativo ? "ativo" : "inativo"}">${u.ativo ? "Ativo" : "Inativo"}</span></td>
        <td>${u.xp_total}</td>
        <td>${u.missoes_completas}</td>
        <td>${u.badges}</td>
        <td>${formatarData(u.criado_em)}</td>
        <td class="acoes-cel"></td>
      `;
      const acoes = document.createElement("div");
      acoes.className = "acoes";

      const btnEd = document.createElement("button");
      btnEd.className = "acao-icone"; btnEd.title = "Editar"; btnEd.textContent = "✏️";
      btnEd.onclick = () => abrirModal(u); acoes.appendChild(btnEd);

      const btnHist = document.createElement("button");
      btnHist.className = "acao-icone"; btnHist.title = "Ver histórico"; btnHist.textContent = "📜";
      btnHist.onclick = () => verHistorico(u); acoes.appendChild(btnHist);

      const btnZerar = document.createElement("button");
      btnZerar.className = "acao-icone perigo"; btnZerar.title = "Zerar pontuação"; btnZerar.textContent = "0️⃣";
      btnZerar.onclick = () => zerarUsuario(u); acoes.appendChild(btnZerar);

      if (!souEu) {
        const btnDel = document.createElement("button");
        btnDel.className = "acao-icone perigo"; btnDel.title = "Excluir"; btnDel.textContent = "🗑️";
        btnDel.onclick = () => excluirUsuario(u); acoes.appendChild(btnDel);
      }

      tr.querySelector(".acoes-cel").appendChild(acoes);
      tbody.appendChild(tr);
    });
  }

  function abrirModal(usuario) {
    estado.modoEdicao = !!usuario;
    estado.editandoId = usuario ? usuario.id : null;

    document.getElementById("modal-titulo").textContent = usuario ? "Editar usuário" : "Novo usuário";
    document.getElementById("usuario-id").value = usuario ? usuario.id : "";
    document.getElementById("usuario-nome").value = usuario ? usuario.nome : "";
    document.getElementById("usuario-email").value = usuario ? usuario.email : "";
    document.getElementById("usuario-senha").value = "";
    document.getElementById("usuario-papel").value = usuario ? usuario.papel : "usuario";
    document.getElementById("usuario-ativo").checked = usuario ? !!usuario.ativo : true;

    const senhaEl = document.getElementById("usuario-senha");
    const hintEl = document.getElementById("senha-hint");
    if (usuario) { senhaEl.required = false; hintEl.textContent = "(deixe em branco para manter)"; }
    else { senhaEl.required = true; hintEl.textContent = "(mín 6)"; }

    document.getElementById("erro-usuario").textContent = "";
    mostrar("modal-usuario");
    setTimeout(() => document.getElementById("usuario-nome").focus(), 50);
  }

  async function salvarUsuario(ev) {
    ev.preventDefault();
    document.getElementById("erro-usuario").textContent = "";

    const nome = document.getElementById("usuario-nome").value.trim();
    const email = document.getElementById("usuario-email").value.trim();
    const senha = document.getElementById("usuario-senha").value;
    const papel = document.getElementById("usuario-papel").value;
    const ativo = document.getElementById("usuario-ativo").checked;

    try {
      if (estado.modoEdicao) {
        const payload = { nome, email, papel, ativo };
        if (senha) payload.senha = senha;
        await API.admin.editarUsuario(estado.editandoId, payload);
      } else {
        await API.admin.criarUsuario({ nome, email, senha, papel });
      }
      esconder("modal-usuario");
      await carregarUsuarios();
    } catch (e) {
      document.getElementById("erro-usuario").textContent = e.message;
    }
  }

  async function excluirUsuario(u) {
    if (!confirm(`Excluir usuário "${u.nome}" (${u.email})?\n\nIsso apagará também toda a pontuação, medalhas e histórico dele.`)) return;
    try { await API.admin.excluirUsuario(u.id); await carregarUsuarios(); }
    catch (e) { alert("Erro: " + e.message); }
  }

  async function zerarUsuario(u) {
    if (!confirm(`Zerar TODA a pontuação de "${u.nome}"?\n\nIsso remove XP, medalhas e histórico. O usuário continua com a conta ativa.`)) return;
    try { await API.admin.zerarUsuario(u.id); await carregarUsuarios(); }
    catch (e) { alert("Erro: " + e.message); }
  }

  async function verHistorico(u) {
    document.getElementById("hist-titulo").textContent = `Histórico — ${u.nome}`;
    const cont = document.getElementById("hist-conteudo");
    cont.innerHTML = "<p style='color:var(--texto-suave)'>Carregando...</p>";
    mostrar("modal-historico");

    try {
      const dados = await API.admin.historico(u.id);
      cont.innerHTML = "";

      const resumo = document.createElement("div");
      resumo.className = "grid-stats";
      resumo.innerHTML = `
        <div class="stat-card"><div class="titulo">XP total</div><div class="valor">${dados.xp_total}</div></div>
        <div class="stat-card"><div class="titulo">Partidas</div><div class="valor">${dados.historico.length}</div></div>
        <div class="stat-card"><div class="titulo">Medalhas</div><div class="valor">${dados.badges.length}</div></div>
      `;
      cont.appendChild(resumo);

      if (dados.badges.length > 0) {
        const h = document.createElement("h4"); h.textContent = "Medalhas conquistadas"; cont.appendChild(h);
        const lista = document.createElement("div"); lista.className = "grid-badges";
        dados.badges.forEach(id => {
          const m = missaoMap[id];
          const card = document.createElement("div"); card.className = "cartao-badge";
          card.innerHTML = `<div class="icone">${m ? m.badge.icone : "🏅"}</div><div class="nome">${escapar(m ? m.badge.nome : id)}</div>`;
          lista.appendChild(card);
        });
        cont.appendChild(lista);
      }

      const h2 = document.createElement("h4"); h2.textContent = "Últimas partidas"; cont.appendChild(h2);

      if (dados.historico.length === 0) {
        cont.insertAdjacentHTML("beforeend", `<p style="color:var(--texto-suave)">Sem partidas registradas.</p>`);
      } else {
        const tabela = document.createElement("table");
        tabela.className = "tabela-admin";
        tabela.innerHTML = `<thead><tr><th>Missão</th><th>Acertos</th><th>XP</th><th>Sequência</th><th>Data</th></tr></thead><tbody></tbody>`;
        const tb = tabela.querySelector("tbody");
        dados.historico.forEach(h => {
          const m = missaoMap[h.missao_id];
          const nome = m ? `${m.icone} ${escapar(m.titulo)}` : escapar(h.missao_id);
          const tr = document.createElement("tr");
          tr.innerHTML = `<td>${nome}</td><td>${h.acertos}/${h.total}</td><td>${h.xp}</td><td>${h.streak_max}</td><td>${formatarData(h.completada_em)}</td>`;
          tb.appendChild(tr);
        });
        cont.appendChild(tabela);
      }
    } catch (e) {
      cont.innerHTML = `<p style="color:var(--erro)">Erro: ${escapar(e.message)}</p>`;
    }
  }

  function bindTabs() {
    document.querySelectorAll(".menu-topo .botao-nav[data-tab]").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".menu-topo .botao-nav").forEach(b => b.classList.remove("ativa"));
        btn.classList.add("ativa");
        document.querySelectorAll(".tab").forEach(t => t.classList.remove("ativa"));
        const tab = btn.dataset.tab;
        document.getElementById("tab-" + tab).classList.add("ativa");
        if (tab === "dashboard") carregarDashboard();
        else if (tab === "usuarios") carregarUsuarios();
      });
    });
  }

  function bind() {
    bindTabs();

    document.getElementById("btn-novo-usuario").addEventListener("click", () => abrirModal(null));
    document.getElementById("form-usuario").addEventListener("submit", salvarUsuario);

    document.querySelectorAll("[data-fechar-modal]").forEach(b => {
      b.addEventListener("click", () => { esconder("modal-usuario"); esconder("modal-historico"); });
    });

    document.getElementById("filtro-usuarios").addEventListener("input", (ev) => {
      estado.filtro = ev.target.value;
      renderizarUsuarios();
    });

    document.getElementById("btn-relatorio-csv").addEventListener("click", async (ev) => {
      ev.preventDefault();
      try {
        const resp = await fetch(API.admin.urlRelatorioCsv(), {
          headers: { Authorization: "Bearer " + API.getToken() },
        });
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const dt = new Date().toISOString().split("T")[0];
        a.download = `ciber-quest-usuarios-${dt}.csv`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      } catch (e) { alert("Erro ao baixar CSV: " + e.message); }
    });

    document.getElementById("btn-logout-admin").addEventListener("click", async () => {
      if (!confirm("Sair da sua conta?")) return;
      try { await API.logout(); } catch (e) {}
      API.limparSessao();
      window.location.href = "/";
    });

    document.querySelectorAll(".modal-overlay").forEach(overlay => {
      overlay.addEventListener("click", (ev) => {
        if (ev.target === overlay) overlay.classList.add("oculto");
      });
    });
  }

  async function init() {
    const ok = await verificarAcesso();
    if (!ok) return;
    document.getElementById("tela-negado").classList.remove("ativa");
    document.getElementById("painel-admin").classList.add("ativa");
    bind();
    carregarDashboard();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
