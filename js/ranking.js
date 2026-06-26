document.addEventListener("DOMContentLoaded", () => {

  // ══════════════════════════════════════════
  //  STORAGE
  // ══════════════════════════════════════════

  function getRankings() {
    return JSON.parse(localStorage.getItem("rankings")) || {};
  }

  function salvarRankings(r) {
    localStorage.setItem("rankings", JSON.stringify(r));
  }

  function getLutadores() {
    return JSON.parse(localStorage.getItem("lutadores")) || {};
  }

  function salvarLutadores(l) {
    localStorage.setItem("lutadores", JSON.stringify(l));
  }

  // ══════════════════════════════════════════
  //  SINCRONIZA eventos -> rankings/lutadores
  // ══════════════════════════════════════════

  function sincronizar() {
    const eventos = JSON.parse(localStorage.getItem("eventos")) || [];
    const rankings = getRankings();
    const lutadores = getLutadores();
    const processadas = JSON.parse(localStorage.getItem("lutasProcessadas")) || [];

    eventos.forEach((evento) => {
      if (!evento.lutas) return;

      evento.lutas.forEach((luta) => {
        if (processadas.includes(luta.id)) return;
        if (!luta.lutador1 || !luta.lutador2 || !luta.categoria) return;

        const cat = luta.categoria;
        const l1 = luta.lutador1.trim();
        const l2 = luta.lutador2.trim();
        const vencedor = (luta.vencedor || "").trim();
        const cinturao = luta.cinturao || "";

        if (!rankings[cat]) rankings[cat] = { campeao: null, lista: [] };

        // garante lutadores no mapa global de stats
        [l1, l2].forEach((nome) => {
          if (!lutadores[nome]) {
            lutadores[nome] = {
              nome,
              vitorias: 0,
              derrotas: 0,
              finishes: 0,
              defesasCinturao: 0,
              conquistasCinturao: 0,
              sequenciaAtual: 0,
              maiorSequencia: 0,
              categorias: [],
            };
          }
          if (!lutadores[nome].categorias.includes(cat)) {
            lutadores[nome].categorias.push(cat);
          }
        });

        // atualiza stats independente de ranking
        if (vencedor === l1) {
          lutadores[l1].vitorias++;
          lutadores[l2].derrotas++;
          lutadores[l1].sequenciaAtual++;
          lutadores[l2].sequenciaAtual = 0;
          if (lutadores[l1].sequenciaAtual > lutadores[l1].maiorSequencia) {
            lutadores[l1].maiorSequencia = lutadores[l1].sequenciaAtual;
          }
          if (["KO/TKO", "Finalização"].includes(luta.metodo)) lutadores[l1].finishes++;
          moverRanking(rankings[cat], l1, l2, cinturao, lutadores);

        } else if (vencedor === l2) {
          lutadores[l2].vitorias++;
          lutadores[l1].derrotas++;
          lutadores[l2].sequenciaAtual++;
          lutadores[l1].sequenciaAtual = 0;
          if (lutadores[l2].sequenciaAtual > lutadores[l2].maiorSequencia) {
            lutadores[l2].maiorSequencia = lutadores[l2].sequenciaAtual;
          }
          if (["KO/TKO", "Finalização"].includes(luta.metodo)) lutadores[l2].finishes++;
          moverRanking(rankings[cat], l2, l1, cinturao, lutadores);
        }

        processadas.push(luta.id);
      });
    });

    salvarRankings(rankings);
    salvarLutadores(lutadores);
    localStorage.setItem("lutasProcessadas", JSON.stringify(processadas));
  }

  // ══════════════════════════════════════════
  //  LÓGICA DE MOVIMENTAÇÃO
  // ══════════════════════════════════════════

  function moverRanking(cat, vencedor, perdedor, cinturao, lutadores) {
    const MAX = 15;

    const vencedorNoCampeao = cat.campeao === vencedor;
    const perdedorNoCampeao = cat.campeao === perdedor;
    const vencedorNaLista  = cat.lista.includes(vencedor);
    const perdedorNaLista  = cat.lista.includes(perdedor);
    const listaCheia       = cat.lista.length >= MAX;

    // ── conquista de cinturão ──
    const ehConquista = ["Cinturão Unificado", "Cinturão Interino", "Cinturão BMF"].includes(cinturao);
    if (ehConquista) {
      // vencedor vira campeão
      cat.lista = cat.lista.filter((n) => n !== vencedor);
      const exCampeao = cat.campeao;
      cat.campeao = vencedor;
      if (lutadores[vencedor]) lutadores[vencedor].conquistasCinturao = (lutadores[vencedor].conquistasCinturao || 0) + 1;

      // ex-campeão volta para o #1 da lista
      if (exCampeao) {
        cat.lista = cat.lista.filter((n) => n !== exCampeao);
        cat.lista.unshift(exCampeao);
      }
      cat.lista = cat.lista.slice(0, MAX);
      return;
    }

    // ── defesa de cinturão ──
    if (cinturao === "Defesa de cinturão") {
      if (lutadores[vencedor]) lutadores[vencedor].defesasCinturao = (lutadores[vencedor].defesasCinturao || 0) + 1;
      // perdedor cai 2 posições na lista
      const idx = cat.lista.indexOf(perdedor);
      if (idx !== -1) {
        cat.lista.splice(idx, 1);
        cat.lista.splice(Math.min(cat.lista.length, idx + 2), 0, perdedor);
      }
      cat.lista = cat.lista.slice(0, MAX);
      return;
    }

    // ── luta normal ──

    // CASO 1: ranking ainda não está cheio → ambos entram se ainda não estiverem
    if (!listaCheia) {
      if (!vencedorNaLista && !vencedorNoCampeao) cat.lista.push(vencedor);
      if (!perdedorNaLista && !perdedorNoCampeao) cat.lista.push(perdedor);
    }

    // CASO 2: ranking cheio → vencedor de fora só entra se ganhou de alguém de dentro
    if (listaCheia) {
      if (!vencedorNaLista && !vencedorNoCampeao) {
        if (perdedorNaLista) {
          // vencedor entra no lugar do perdedor; perdedor sai do ranking
          const idxP = cat.lista.indexOf(perdedor);
          cat.lista.splice(idxP, 1, vencedor);
          cat.lista = cat.lista.slice(0, MAX);
          return;
        }
        // nenhum dos dois no ranking → não mexe
        return;
      }
    }

    // CASO 3: ambos (ou pelo menos o vencedor) já estão no ranking → movimenta
    const idxV = cat.lista.indexOf(vencedor);
    const idxP = cat.lista.indexOf(perdedor);

    // vencedor sobe uma posição
    if (idxV > 0) {
      cat.lista.splice(idxV, 1);
      cat.lista.splice(idxV - 1, 0, vencedor);
    }

    // perdedor desce uma posição
    const novoIdxP = cat.lista.indexOf(perdedor);
    if (novoIdxP !== -1 && novoIdxP < cat.lista.length - 1) {
      cat.lista.splice(novoIdxP, 1);
      cat.lista.splice(novoIdxP + 1, 0, perdedor);
    }

    cat.lista = cat.lista.slice(0, MAX);
  }

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

    // campeão
    if (cat.campeao) {
      const l = lutadores[cat.campeao] || { nome: cat.campeao, vitorias: 0, derrotas: 0, finishes: 0, sequenciaAtual: 0, defesasCinturao: 0 };
      container.innerHTML += criarCardCampeao(l);
    }

    if (cat.campeao && cat.lista.length > 0) {
      container.innerHTML += `<div class="ranking-divisor">Contendores</div>`;
    }

    // lista com drag & drop
    const wrapper = document.createElement("div");
    wrapper.classList.add("lista-drag");

    cat.lista.forEach((nome, i) => {
      const l = lutadores[nome] || { nome, vitorias: 0, derrotas: 0, finishes: 0, sequenciaAtual: 0, defesasCinturao: 0 };
      const card = document.createElement("div");
      card.classList.add("lutador-card");
      card.draggable = true;
      card.dataset.nome = nome;
      card.innerHTML = criarCardHTML(l, i + 1, false);

      // botão remover do ranking
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
    const mapa = {};

    Object.values(rankings).forEach((cat) => {
      if (cat.campeao) {
        if (!mapa[cat.campeao]) mapa[cat.campeao] = { peso: 0, campeao: false };
        mapa[cat.campeao].campeao = true;
        mapa[cat.campeao].peso = Math.max(mapa[cat.campeao].peso, 16);
      }
      cat.lista.forEach((nome, i) => {
        if (!mapa[nome]) mapa[nome] = { peso: 0, campeao: false };
        mapa[nome].peso = Math.max(mapa[nome].peso, 15 - i);
      });
    });

    const lista = Object.entries(mapa)
      .sort((a, b) => {
        if (a[1].campeao && !b[1].campeao) return -1;
        if (!a[1].campeao && b[1].campeao) return 1;
        return b[1].peso - a[1].peso;
      })
      .slice(0, 15);

    if (lista.length === 0) {
      container.innerHTML = `<p class="vazio">Registre eventos com categoria de peso para ver o P4P.</p>`;
      return;
    }

    container.innerHTML = lista.map(([nome, info], i) => {
      const l = lutadores[nome] || { nome, vitorias: 0, derrotas: 0, finishes: 0, sequenciaAtual: 0, defesasCinturao: 0 };
      return `<div class="lutador-card">${criarCardHTML(l, i + 1, info.campeao)}</div>`;
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
              <span class="stat"><strong>${l.vitorias || 0}V</strong> ${l.derrotas || 0}D</span>
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
    return `
      <div class="lutador-card campeao-card">
        <span class="posicao ouro">👑</span>
        <div class="avatar avatar-campeao">${iniciais}</div>
        <div class="lutador-info">
          <div class="lutador-nome">${l.nome} <span class="badge cinturao">Campeão</span></div>
          <div class="lutador-stats">
            <span class="stat"><strong>${l.vitorias || 0}V</strong> ${l.derrotas || 0}D</span>
            <span class="stat">Finishes: <strong>${finishRate}%</strong></span>
            <span class="stat">Defesas: <strong>${l.defesasCinturao || 0}</strong></span>
            <span class="stat">Seq. ativa: <strong>${l.sequenciaAtual || 0}</strong></span>
          </div>
        </div>
      </div>
    `;
  }

  function criarCardHTML(l, pos, isCampeao) {
    const corPos = pos === 1 ? "ouro" : pos === 2 ? "prata" : pos === 3 ? "bronze" : "";
    const iniciais = l.nome.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
    const finishRate = l.vitorias > 0 ? Math.round(((l.finishes || 0) / l.vitorias) * 100) : 0;
    return `
      <span class="posicao ${corPos}">${isCampeao ? "👑" : "#" + pos}</span>
      <div class="avatar">${iniciais}</div>
      <div class="lutador-info">
        <div class="lutador-nome">${l.nome}</div>
        <div class="lutador-stats">
          <span class="stat"><strong>${l.vitorias || 0}V</strong> ${l.derrotas || 0}D</span>
          <span class="stat">Finishes: <strong>${finishRate}%</strong></span>
          <span class="stat">Seq. ativa: <strong>${l.sequenciaAtual || 0}</strong></span>
        </div>
        <div class="badges">
          ${(l.defesasCinturao || 0) > 0 ? `<span class="badge cinturao">🏆 ${l.defesasCinturao} def.</span>` : ""}
          ${(l.sequenciaAtual || 0) >= 3 ? `<span class="badge sequencia">🔥 ${l.sequenciaAtual} seg.</span>` : ""}
        </div>
      </div>
      <span class="drag-handle" title="Arrastar para reordenar">⠿</span>
    `;
  }

  function calcularGOAT(l) {
    const total = (l.vitorias || 0) + (l.derrotas || 0);
    if (total < 3) return null;
    let pts = 0;
    pts += (l.vitorias || 0) * 3;
    pts -= (l.derrotas || 0) * 1;
    pts += (l.finishes || 0) * 1;
    pts += (l.defesasCinturao || 0) * 5;
    pts += (l.conquistasCinturao || 0) * 4;
    pts += (l.maiorSequencia || 0) * 0.3;
    const fr = l.vitorias > 0 ? (l.finishes || 0) / l.vitorias : 0;
    pts += fr * 2;
    pts += Math.log(total) * 0.5;
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

  // ══════════════════════════════════════════
  //  INIT
  // ══════════════════════════════════════════

  sincronizar();
  renderP4P();
  renderGOAT();
});