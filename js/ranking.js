document.addEventListener("DOMContentLoaded", () => {

  recalcularRanking(); // vem do ranking-engine.js

  // ══════════════════════════════════════════
  //  RENDER CATEGORIA
  // ══════════════════════════════════════════

  function renderCategoria(categoria) {
    const rankings = getRankings();
    const lutadores = getLutadores();
    const container = document.getElementById("lista-categoria");

    if (!categoria) { container.innerHTML = ""; return; }

    const cat = rankings[categoria];

    if (!cat || (!cat.campeao && cat.lista.length === 0)) {
      container.innerHTML = `<p class="vazio">Nenhum lutador nesta categoria ainda.</p>`;
      return;
    }

    container.innerHTML = "";

    if (cat.campeao) {
      const l = lutadores[cat.campeao] || { nome: cat.campeao, vitorias: 0, derrotas: 0, finishes: 0, sequenciaAtual: 0, defesasCinturao: 0 };
      container.innerHTML += criarCardCampeao(l);
    }

    if (cat.campeao && cat.lista.length > 0) {
      container.innerHTML += `<div class="ranking-divisor">Contendores</div>`;
    }

    const wrapper = document.createElement("div");
    wrapper.classList.add("lista-drag");

    cat.lista.forEach((nome, i) => {
      const l = lutadores[nome] || { nome, vitorias: 0, derrotas: 0, finishes: 0, sequenciaAtual: 0, defesasCinturao: 0 };
      const card = document.createElement("div");
      card.classList.add("lutador-card");
      card.draggable = true;
      card.dataset.nome = nome;
      card.innerHTML = criarCardHTML(l, i + 1, false, rankings[categoria]);

      const btnRemover = document.createElement("button");
      btnRemover.classList.add("btn-remover-ranking");
      btnRemover.title = "Remover do ranking";
      btnRemover.textContent = "✕";
      btnRemover.addEventListener("click", () => {
        removerDoRanking(categoria, nome);
        renderCategoria(categoria);
      });
      card.appendChild(btnRemover);

      wrapper.appendChild(card);
    });

    container.appendChild(wrapper);
    ativarDragDrop(wrapper, categoria);
  }

  function removerDoRanking(categoria, nome) {
    const rankings = getRankings();
    if (!rankings[categoria]) return;
    rankings[categoria].lista = rankings[categoria].lista.filter((n) => n !== nome);
    if (rankings[categoria].campeao === nome) rankings[categoria].campeao = null;
    salvarRankings(rankings);
  }

  // ══════════════════════════════════════════
  //  RENDER P4P
  // ══════════════════════════════════════════

  function renderP4P() {
    const rankings = getRankings();
    const lutadores = getLutadores();
    const container = document.getElementById("lista-p4p");
    const vistos = new Set();
    const lista = [];

    Object.entries(rankings).forEach(([cat, catData]) => {
      if (catData.campeao && !vistos.has(catData.campeao)) {
        vistos.add(catData.campeao);
        lista.push({ nome: catData.campeao, campeao: true });
      }
      catData.lista.forEach((nome) => {
        if (!vistos.has(nome)) {
          vistos.add(nome);
          lista.push({ nome, campeao: false });
        }
      });
    });

    if (lista.length === 0) {
      container.innerHTML = `<p class="vazio">Registre eventos com categoria de peso para ver o P4P.</p>`;
      return;
    }

    // ordena por score — campeões ganham bônus de 30pts
    lista.sort((a, b) => {
      const la = lutadores[a.nome] || {};
      const lb = lutadores[b.nome] || {};
      const scoreA = calcularScore(la, lutadores, null) + (a.campeao ? 30 : 0);
      const scoreB = calcularScore(lb, lutadores, null) + (b.campeao ? 30 : 0);
      return scoreB - scoreA;
    });

    container.innerHTML = lista.slice(0, 15).map(({ nome, campeao }, i) => {
      const l = lutadores[nome] || { nome, vitorias: 0, derrotas: 0, finishes: 0, sequenciaAtual: 0, defesasCinturao: 0 };
      return `<div class="lutador-card">${criarCardHTML(l, i + 1, campeao, null)}</div>`;
    }).join("");
  }

  // ══════════════════════════════════════════
  //  RENDER GOAT
  // ══════════════════════════════════════════

  function renderGOAT() {
    const lutadores = getLutadores();
    const container = document.getElementById("lista-goat");

    const lista = Object.values(lutadores)
      .map((l) => ({ ...l, goat: calcularGOAT(l) }))
      .filter((l) => l.goat !== null)
      .sort((a, b) => b.goat - a.goat)
      .slice(0, 15);

    if (lista.length === 0) {
      container.innerHTML = `<p class="vazio">Mínimo de 3 lutas registradas para entrar no GOAT ranking.</p>`;
      return;
    }

    container.innerHTML = lista.map((l, i) => {
      const pos = i + 1;
      const isTop = pos === 1;
      const corPos = pos === 1 ? "ouro" : pos === 2 ? "prata" : pos === 3 ? "bronze" : "";
      const iniciais = l.nome.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
      const finishRate = l.vitorias > 0 ? Math.round(((l.finishes || 0) / l.vitorias) * 100) : 0;
      return `
        <div class="lutador-card ${isTop ? "goat-top" : ""}">
          <span class="posicao ${corPos}">${isTop ? "🐐" : "#" + pos}</span>
          <div class="avatar ${isTop ? "avatar-campeao" : ""}">${iniciais}</div>
          <div class="lutador-info">
            <div class="lutador-nome">${l.nome}</div>
            <div class="lutador-stats">
              <span class="stat"><strong>${l.vitorias || 0}V</strong> ${l.derrotas || 0}D ${l.empates ? l.empates + "E" : ""}</span>
              <span class="stat">Finishes: <strong>${finishRate}%</strong></span>
              <span class="stat">Seq. ativa: <strong>${l.sequenciaAtual || 0}</strong></span>
              <span class="stat">Maior seq.: <strong>${l.maiorSequencia || 0}</strong></span>
            </div>
            <div class="badges">
              ${(l.defesasCinturao || 0) > 0 ? `<span class="badge cinturao">🏆 ${l.defesasCinturao} defesa${l.defesasCinturao > 1 ? "s" : ""}</span>` : ""}
              ${(l.conquistasCinturao || 0) > 0 ? `<span class="badge cinturao">👑 ${l.conquistasCinturao} cinturão</span>` : ""}
              ${(l.sequenciaAtual || 0) >= 3 ? `<span class="badge sequencia">🔥 ${l.sequenciaAtual} seguidas</span>` : ""}
            </div>
          </div>
          <div class="pontuacao">
            <span class="pontuacao-valor">${l.goat}</span>
            <span class="pontuacao-label">GOAT pts</span>
          </div>
        </div>
      `;
    }).join("");
  }

  // ══════════════════════════════════════════
  //  HELPERS
  // ══════════════════════════════════════════

  function criarCardCampeao(l) {
    const iniciais = l.nome.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
    const finishRate = l.vitorias > 0 ? Math.round(((l.finishes || 0) / l.vitorias) * 100) : 0;
    const rankings = getRankings();
    const catData = l.categorias?.[0] ? rankings[l.categorias[0]] : null;
    const score = calcularScore(l, getLutadores(), catData);
    return `
      <div class="lutador-card campeao-card">
        <span class="posicao ouro">👑</span>
        <div class="avatar avatar-campeao">${iniciais}</div>
        <div class="lutador-info">
          <div class="lutador-nome">${l.nome} <span class="badge cinturao">Campeão</span></div>
          <div class="lutador-stats">
            <span class="stat"><strong>${l.vitorias || 0}V</strong> ${l.derrotas || 0}D ${l.empates ? l.empates + "E" : ""}</span>
            <span class="stat">Finishes: <strong>${finishRate}%</strong></span>
            <span class="stat">Defesas: <strong>${l.defesasCinturao || 0}</strong></span>
            <span class="stat">Seq. ativa: <strong>${l.sequenciaAtual || 0}</strong></span>
          </div>
        </div>
        <div class="pontuacao" style="margin-right:8px">
          <span class="pontuacao-valor" style="font-size:1rem">${score}</span>
          <span class="pontuacao-label">score</span>
        </div>
      </div>
    `;
  }

  function criarCardHTML(l, pos, isCampeao, catData) {
    const corPos = pos === 1 ? "ouro" : pos === 2 ? "prata" : pos === 3 ? "bronze" : "";
    const iniciais = l.nome.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
    const finishRate = l.vitorias > 0 ? Math.round(((l.finishes || 0) / l.vitorias) * 100) : 0;
    const score = calcularScore(l, getLutadores(), catData || null);

    // melhor vitória (contra oponente mais bem ranqueado)
    let vitoriaNotavel = "";
    if (catData && l.historicoVitorias?.length > 0) {
      const melhor = l.historicoVitorias.reduce((acc, v) => {
        const posV   = getPosicaoNoRanking(v.oponente, catData);
        const posAcc = getPosicaoNoRanking(acc.oponente, catData);
        const numV   = posV === "campeao" ? 0 : (typeof posV === "number" ? posV : 99);
        const numAcc = posAcc === "campeao" ? 0 : (typeof posAcc === "number" ? posAcc : 99);
        return numV < numAcc ? v : acc;
      });
      const posOp = getPosicaoNoRanking(melhor.oponente, catData);
      const label = posOp === "campeao" ? "Campeão" : posOp <= 15 ? `#${posOp}` : "NR";
      vitoriaNotavel = `<span class="stat">Melhor win: <strong>${melhor.oponente} (${label})</strong></span>`;
    }

    return `
      <span class="posicao ${corPos}">${isCampeao ? "👑" : "#" + pos}</span>
      <div class="avatar">${iniciais}</div>
      <div class="lutador-info">
        <div class="lutador-nome">${l.nome}</div>
        <div class="lutador-stats">
          <span class="stat"><strong>${l.vitorias || 0}V</strong> ${l.derrotas || 0}D ${l.empates ? l.empates + "E" : ""}</span>
          <span class="stat">Finishes: <strong>${finishRate}%</strong></span>
          <span class="stat">Seq. ativa: <strong>${l.sequenciaAtual || 0}</strong></span>
          ${vitoriaNotavel}
        </div>
        <div class="badges">
          ${(l.defesasCinturao || 0) > 0 ? `<span class="badge cinturao">🏆 ${l.defesasCinturao} def.</span>` : ""}
          ${(l.sequenciaAtual || 0) >= 3 ? `<span class="badge sequencia">🔥 ${l.sequenciaAtual} seg.</span>` : ""}
        </div>
      </div>
      <div class="pontuacao" style="margin-right:8px">
        <span class="pontuacao-valor" style="font-size:1rem">${score}</span>
        <span class="pontuacao-label">score</span>
      </div>
      <span class="drag-handle" title="Arrastar para reordenar">⠿</span>
    `;
  }

  function calcularGOAT(l) {
    const total = (l.vitorias || 0) + (l.derrotas || 0);
    if (total < 3) return null;
    let pts = 0;
    pts += (l.vitorias || 0) * 3;
    pts -= (l.derrotas || 0) * 1.5;
    pts += (l.finishes || 0) * 1;
    pts += (l.defesasCinturao || 0) * 5;
    pts += (l.conquistasCinturao || 0) * 4;
    pts += (l.maiorSequencia || 0) * 0.3;
    const fr = l.vitorias > 0 ? (l.finishes || 0) / l.vitorias : 0;
    pts += fr * 2;
    pts += Math.log(total) * 0.5;
    // bônus de vitórias notáveis no histórico
    (l.historicoVitorias || []).forEach((v, i) => {
      const recencia = Math.pow(0.85, (l.historicoVitorias.length - 1 - i));
      pts += 1 * recencia;
    });
    return Math.round(pts * 10) / 10;
  }

  // ══════════════════════════════════════════
  //  DRAG & DROP
  // ══════════════════════════════════════════

  function ativarDragDrop(wrapper, categoria) {
    let dragging = null;

    wrapper.querySelectorAll(".lutador-card").forEach((card) => {
      card.addEventListener("dragstart", () => {
        dragging = card;
        setTimeout(() => card.classList.add("arrastando"), 0);
      });
      card.addEventListener("dragend", () => {
        card.classList.remove("arrastando");
        dragging = null;
        salvarOrdem(wrapper, categoria);
        renderCategoria(categoria);
      });
      card.addEventListener("dragover", (e) => {
        e.preventDefault();
        if (!dragging || dragging === card) return;
        const mid = card.getBoundingClientRect().top + card.getBoundingClientRect().height / 2;
        wrapper.insertBefore(dragging, e.clientY < mid ? card : card.nextSibling);
      });
    });
  }

  function salvarOrdem(wrapper, categoria) {
    const rankings = getRankings();
    if (!rankings[categoria]) return;
    rankings[categoria].lista = [...wrapper.querySelectorAll(".lutador-card")]
      .map((c) => c.dataset.nome)
      .slice(0, 15);
    salvarRankings(rankings);
  }

  // ══════════════════════════════════════════
  //  ABAS
  // ══════════════════════════════════════════

  document.querySelectorAll(".aba").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".aba").forEach((b) => b.classList.remove("ativa"));
      document.querySelectorAll(".painel").forEach((p) => p.classList.remove("ativa"));
      btn.classList.add("ativa");
      document.getElementById("painel-" + btn.dataset.aba).classList.add("ativa");
    });
  });

  document.getElementById("selectCategoria").addEventListener("change", function () {
    renderCategoria(this.value);
  });

  renderP4P();
  renderGOAT();
});