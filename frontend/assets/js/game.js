/* ============================================================
   CIBER QUEST — Lógica do jogo (frontend)
   Login/cadastro, navegação, fluxo de missão, ranking, perfil.
   Todas as operações persistidas via API.
   ============================================================ */

(function () {
  "use strict";

  const est = {
    usuario: null,
    xpTotal: 0,
    missoesFeitas: {},
    badges: new Set(),

    missaoAtual: null,
    perguntaIndex: 0,
    acertosMissao: 0,
    xpMissao: 0,
    streakAtual: 0,
    streakMaxMissao: 0,
  };

  window.CiberQuest = { aoDeslogar: () => voltarParaLogin() };

  function mostrarTela(id) {
    document.querySelectorAll(".tela").forEach(t => t.classList.remove("ativa"));
    const alvo = document.getElementById(id);
    if (alvo) {
      alvo.classList.add("ativa");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    document.querySelectorAll(".menu-topo .botao-nav").forEach(b => {
      b.classList.toggle("ativa", b.dataset.nav === id);
    });
  }

  function mostrarTopo(mostrar) {
    document.getElementById("topo").classList.toggle("oculto", !mostrar);
  }

  function voltarParaLogin() {
    API.limparSessao();
    est.usuario = null;
    est.xpTotal = 0;
    est.missoesFeitas = {};
    est.badges = new Set();
    mostrarTopo(false);
    mostrarTela("tela-login");
  }

  function calcularNivel(xp) {
    const niveis = window.CONFIG.niveis;
    let atual = niveis[0];
    for (const n of niveis) if (xp >= n.xp) atual = n;
    return atual;
  }

  async function aposLogin() {
    try {
      const dados = await API.eu();
      est.usuario = dados.usuario;
      est.xpTotal = dados.xp_total || 0;
      est.missoesFeitas = {};
      (dados.missoes || []).forEach(m => { est.missoesFeitas[m.missao_id] = m; });
      est.badges = new Set(dados.badges || []);
      atualizarTopo();
      mostrarTopo(true);
      document.getElementById("admin-link").classList.toggle("oculto", est.usuario.papel !== "admin");
      renderizarListaMissoes();
      mostrarTela("tela-missoes");
    } catch (e) {
      console.error(e);
      voltarParaLogin();
    }
  }

  function atualizarTopo() {
    const nivel = calcularNivel(est.xpTotal);
    document.getElementById("nome-topo").textContent = est.usuario ? est.usuario.nome : "Jogador";
    document.getElementById("nivel-topo").textContent = `${nivel.emoji} ${nivel.nome}`;
    document.getElementById("xp-total").textContent = est.xpTotal;
  }

  function renderizarListaMissoes() {
    const lista = document.getElementById("lista-missoes");
    lista.innerHTML = "";
    window.MISSOES.forEach(missao => {
      const info = est.missoesFeitas[missao.id];
      const completa = !!info;
      const card = document.createElement("div");
      card.className = "cartao-missao" + (completa ? " completa" : "");
      card.innerHTML = `
        <div class="icone-missao">${missao.icone}</div>
        <div class="titulo-missao">${escapar(missao.titulo)}</div>
        <div class="descricao-missao">${escapar(missao.descricao)}</div>
        <div class="info-missao">
          <span>${missao.perguntas.length} perguntas</span>
          ${completa
            ? `<span class="selo-completa">${info.acertos}/${info.total} ✓</span>`
            : `<span>Iniciar →</span>`}
        </div>
      `;
      card.addEventListener("click", () => iniciarMissao(missao.id));
      lista.appendChild(card);
    });
  }

  function iniciarMissao(id) {
    const missao = window.MISSOES.find(m => m.id === id);
    if (!missao) return;
    est.missaoAtual = missao;
    est.perguntaIndex = 0;
    est.acertosMissao = 0;
    est.xpMissao = 0;
    est.streakAtual = 0;
    est.streakMaxMissao = 0;
    mostrarTela("tela-jogo");
    renderizarPergunta();
  }

  function renderizarPergunta() {
    const m = est.missaoAtual;
    const p = m.perguntas[est.perguntaIndex];
    document.getElementById("tag-missao").textContent = `${m.icone} ${m.titulo}`;
    document.getElementById("cenario").textContent = p.cenario || "";
    document.getElementById("pergunta").textContent = p.pergunta;
    document.getElementById("progresso-texto").textContent = `Pergunta ${est.perguntaIndex + 1} de ${m.perguntas.length}`;
    document.getElementById("barra-progresso").style.width = `${(est.perguntaIndex / m.perguntas.length) * 100}%`;
    document.getElementById("xp-jogo").textContent = est.xpTotal + est.xpMissao;

    const container = document.getElementById("alternativas");
    container.innerHTML = "";
    p.alternativas.forEach((alt, idx) => {
      const btn = document.createElement("button");
      btn.className = "alternativa";
      btn.textContent = alt;
      btn.addEventListener("click", () => responder(idx));
      container.appendChild(btn);
    });

    const fb = document.getElementById("feedback");
    fb.classList.add("oculto");
    fb.classList.remove("sucesso", "erro");
  }

  function responder(idx) {
    const m = est.missaoAtual;
    const p = m.perguntas[est.perguntaIndex];
    const correta = idx === p.correta;

    const botoes = document.querySelectorAll("#alternativas .alternativa");
    botoes.forEach((b, i) => {
      b.disabled = true;
      if (i === p.correta) b.classList.add("correta");
      else if (i === idx && !correta) b.classList.add("errada");
    });

    if (correta) {
      est.acertosMissao++;
      est.streakAtual++;
      if (est.streakAtual > est.streakMaxMissao) est.streakMaxMissao = est.streakAtual;
      const bonus = est.streakAtual >= 2 ? window.CONFIG.xpStreak * (est.streakAtual - 1) : 0;
      est.xpMissao += window.CONFIG.xpAcerto + bonus;
    } else {
      est.streakAtual = 0;
      est.xpMissao += window.CONFIG.xpErro;
    }

    document.getElementById("xp-jogo").textContent = est.xpTotal + est.xpMissao;

    const fb = document.getElementById("feedback");
    fb.classList.remove("oculto");
    fb.classList.add(correta ? "sucesso" : "erro");
    document.getElementById("feedback-titulo").textContent =
      correta ? "✓ Correto!" : "✗ Errou — mas está tudo bem, é assim que se aprende";
    document.getElementById("feedback-texto").textContent = p.explicacao;
    document.getElementById("feedback-referencia").textContent = p.referencia ? `Base: ${p.referencia}` : "";
  }

  async function proximaPergunta() {
    est.perguntaIndex++;
    if (est.perguntaIndex >= est.missaoAtual.perguntas.length) {
      await finalizarMissao();
    } else {
      renderizarPergunta();
    }
  }

  async function finalizarMissao() {
    const m = est.missaoAtual;
    const total = m.perguntas.length;
    let badgeNova = false;
    let xpTotalNovo = est.xpTotal + est.xpMissao;

    try {
      const resp = await API.completarMissao(m.id, est.acertosMissao, total, est.xpMissao, est.streakMaxMissao);
      badgeNova = !!resp.badge_nova;
      xpTotalNovo = resp.xp_total;
    } catch (e) {
      alert("Não foi possível salvar o resultado: " + e.message);
    }

    est.xpTotal = xpTotalNovo;
    const anterior = est.missoesFeitas[m.id];
    if (!anterior || est.acertosMissao > anterior.acertos) {
      est.missoesFeitas[m.id] = { acertos: est.acertosMissao, total, xp_max: est.xpMissao };
    }
    if (badgeNova) est.badges.add(m.id);

    renderizarResultado(badgeNova ? m.badge : null);
    mostrarTela("tela-resultado");
    atualizarTopo();
  }

  function renderizarResultado(badgeNova) {
    const m = est.missaoAtual;
    const total = m.perguntas.length;
    const p = est.acertosMissao / total;

    const emojiEl = document.getElementById("emoji-resultado");
    const tituloEl = document.getElementById("titulo-resultado");
    const subtituloEl = document.getElementById("subtitulo-resultado");

    if (p === 1) {
      emojiEl.textContent = "🏆";
      tituloEl.textContent = "Perfeito!";
      subtituloEl.textContent = `Você acertou tudo em "${m.titulo}". Nível de defesa: alto.`;
    } else if (p >= 0.7) {
      emojiEl.textContent = "🎉";
      tituloEl.textContent = "Muito bem!";
      subtituloEl.textContent = `Você dominou o essencial de "${m.titulo}".`;
    } else if (p >= 0.4) {
      emojiEl.textContent = "💪";
      tituloEl.textContent = "Bom começo!";
      subtituloEl.textContent = "Reveja e tente de novo. Cada erro te deixa mais preparado.";
    } else {
      emojiEl.textContent = "📖";
      tituloEl.textContent = "Não desista";
      subtituloEl.textContent = "É normal errar no começo. Reveja os cenários e refaça.";
    }

    document.getElementById("stat-acertos").textContent = `${est.acertosMissao}/${total}`;
    document.getElementById("stat-xp-ganho").textContent = `+${est.xpMissao}`;
    document.getElementById("stat-streak").textContent = est.streakMaxMissao;

    const badgeCard = document.getElementById("badge-conquistada");
    if (badgeNova) {
      badgeCard.classList.remove("oculto");
      document.getElementById("badge-nova-icone").textContent = badgeNova.icone;
      document.getElementById("badge-nova-nome").textContent = badgeNova.nome;
    } else {
      badgeCard.classList.add("oculto");
    }
  }

  function renderizarConquistas() {
    const grid = document.getElementById("grid-badges");
    grid.innerHTML = "";
    window.MISSOES.forEach(m => {
      const conquistada = est.badges.has(m.id);
      const card = document.createElement("div");
      card.className = "cartao-badge" + (conquistada ? "" : " bloqueada");
      card.innerHTML = `
        <div class="icone">${m.badge.icone}</div>
        <div class="nome">${escapar(m.badge.nome)}</div>
        <div class="desc">${conquistada ? "Desbloqueada" : "Complete \"" + escapar(m.titulo) + "\" com 70%+ de acerto."}</div>
      `;
      grid.appendChild(card);
    });
  }

  async function renderizarRanking() {
    const corpo = document.getElementById("corpo-ranking");
    corpo.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:40px; color:var(--texto-suave);">Carregando...</td></tr>`;
    try {
      const dados = await API.ranking();
      const top = dados.top || [];
      if (top.length === 0) {
        corpo.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:40px; color:var(--texto-suave);">Ainda ninguém pontuou. Seja o primeiro!</td></tr>`;
        return;
      }
      corpo.innerHTML = "";
      top.forEach((r, i) => {
        const posClass = i === 0 ? "posicao-1" : i === 1 ? "posicao-2" : i === 2 ? "posicao-3" : "";
        const medalha = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : (i + 1);
        const ehVoce = est.usuario && r.id === est.usuario.id;
        const tr = document.createElement("tr");
        if (ehVoce) tr.classList.add("voce");
        tr.innerHTML = `
          <td class="${posClass}">${medalha}</td>
          <td>${escapar(r.nome)}${ehVoce ? " <strong>(você)</strong>" : ""}</td>
          <td>${r.xp_total}</td>
          <td>${r.missoes_completas || 0}</td>
          <td>${r.badges || 0}</td>
        `;
        corpo.appendChild(tr);
      });
    } catch (e) {
      corpo.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:40px; color:var(--erro);">Erro: ${escapar(e.message)}</td></tr>`;
    }
  }

  function renderizarPerfil() {
    if (!est.usuario) return;
    const nivel = calcularNivel(est.xpTotal);
    document.getElementById("perfil-nome").textContent = est.usuario.nome;
    document.getElementById("perfil-email").textContent = est.usuario.email;
    document.getElementById("perfil-nivel").textContent = `${nivel.emoji} ${nivel.nome}`;
    document.getElementById("perfil-xp").textContent = est.xpTotal;
    document.getElementById("perfil-missoes").textContent = Object.keys(est.missoesFeitas).length;
    document.getElementById("perfil-badges").textContent = est.badges.size;

    const cont = document.getElementById("perfil-tabela-missoes");
    cont.innerHTML = '<div class="perfil-tabela"></div>';
    const tabela = cont.querySelector(".perfil-tabela");
    window.MISSOES.forEach(m => {
      const info = est.missoesFeitas[m.id];
      const acertos = info ? info.acertos : 0;
      const total = m.perguntas.length;
      const pct = total ? Math.round((acertos / total) * 100) : 0;
      const linha = document.createElement("div");
      linha.className = "linha";
      linha.innerHTML = `
        <div class="nome-missao">${m.icone} ${escapar(m.titulo)}</div>
        <div class="barra-mini"><div class="barra-mini-preenchida" style="width:${pct}%"></div></div>
        <div class="pontos">${acertos}/${total}</div>
      `;
      tabela.appendChild(linha);
    });
  }

  function escapar(t) {
    const div = document.createElement("div");
    div.textContent = t == null ? "" : String(t);
    return div.innerHTML;
  }

  function mostrarErro(idErro, msg) {
    const el = document.getElementById(idErro);
    el.textContent = msg || "";
  }

  function bind() {
    document.getElementById("ir-cadastro").addEventListener("click", () => {
      mostrarErro("erro-cadastro", "");
      mostrarTela("tela-cadastro");
    });
    document.getElementById("ir-login").addEventListener("click", () => {
      mostrarErro("erro-login", "");
      mostrarTela("tela-login");
    });
    document.getElementById("ir-sobre-login").addEventListener("click", () => mostrarTela("tela-sobre"));
    document.querySelectorAll("[data-voltar-para]").forEach(btn => {
      btn.addEventListener("click", () => mostrarTela(btn.dataset.voltarPara));
    });

    document.getElementById("form-login").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      mostrarErro("erro-login", "");
      const email = document.getElementById("login-email").value.trim();
      const senha = document.getElementById("login-senha").value;
      try {
        const resp = await API.login(email, senha);
        API.setSessao(resp.token, resp.usuario);
        document.getElementById("login-senha").value = "";
        await aposLogin();
      } catch (e) {
        mostrarErro("erro-login", e.message);
      }
    });

    document.getElementById("form-cadastro").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      mostrarErro("erro-cadastro", "");
      const nome = document.getElementById("cad-nome").value.trim();
      const email = document.getElementById("cad-email").value.trim();
      const senha = document.getElementById("cad-senha").value;
      const senha2 = document.getElementById("cad-senha2").value;
      if (senha !== senha2) {
        mostrarErro("erro-cadastro", "As senhas não conferem.");
        return;
      }
      try {
        const resp = await API.registrar(nome, email, senha);
        API.setSessao(resp.token, resp.usuario);
        await aposLogin();
      } catch (e) {
        mostrarErro("erro-cadastro", e.message);
      }
    });

    document.getElementById("btn-logout").addEventListener("click", async () => {
      if (!confirm("Sair da sua conta?")) return;
      try { await API.logout(); } catch (e) { /* ignora */ }
      voltarParaLogin();
    });

    document.querySelectorAll(".menu-topo .botao-nav[data-nav]").forEach(btn => {
      btn.addEventListener("click", () => {
        const alvo = btn.dataset.nav;
        if (alvo === "tela-ranking-app") renderizarRanking();
        else if (alvo === "tela-conquistas") renderizarConquistas();
        else if (alvo === "tela-perfil") renderizarPerfil();
        else if (alvo === "tela-missoes") renderizarListaMissoes();
        mostrarTela(alvo);
      });
    });

    document.getElementById("admin-link").addEventListener("click", () => {
      window.location.href = "/admin";
    });

    document.getElementById("btn-voltar-missoes").addEventListener("click", () => {
      if (confirm("Sair da missão atual? O progresso desta missão será perdido.")) {
        renderizarListaMissoes();
        mostrarTela("tela-missoes");
      }
    });
    document.getElementById("btn-proxima").addEventListener("click", () => proximaPergunta());
    document.getElementById("btn-voltar-inicio").addEventListener("click", () => {
      renderizarListaMissoes();
      mostrarTela("tela-missoes");
    });
    document.getElementById("btn-refazer").addEventListener("click", () => {
      iniciarMissao(est.missaoAtual.id);
    });
  }

  async function init() {
    bind();
    if (API.estaLogado()) {
      try { await aposLogin(); }
      catch (e) { voltarParaLogin(); }
    } else {
      voltarParaLogin();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
