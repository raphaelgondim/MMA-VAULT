// ══════════════════════════════════════════
//  RANKING ENGINE
//  (usado por ranking.js e eventos.js)
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

// ── lógica de movimentação (igual à original) ──
function moverRanking(cat, vencedor, perdedor, cinturao, lutadores) {
  const MAX = 15;

  const vencedorNoCampeao = cat.campeao === vencedor;
  const perdedorNoCampeao = cat.campeao === perdedor;
  const vencedorNaLista = cat.lista.includes(vencedor);
  const perdedorNaLista = cat.lista.includes(perdedor);
  const listaCheia = cat.lista.length >= MAX;

  const ehConquista = [
    "Cinturão Unificado",
    "Cinturão Interino",
    "Cinturão BMF",
  ].includes(cinturao);
  if (ehConquista) {
    cat.lista = cat.lista.filter((n) => n !== vencedor);
    const exCampeao = cat.campeao;
    cat.campeao = vencedor;
    if (lutadores[vencedor])
      lutadores[vencedor].conquistasCinturao =
        (lutadores[vencedor].conquistasCinturao || 0) + 1;

    if (exCampeao) {
      cat.lista = cat.lista.filter((n) => n !== exCampeao);
      cat.lista.unshift(exCampeao);
    }
    cat.lista = cat.lista.slice(0, MAX);
    return;
  }

  if (cinturao === "Defesa de cinturão") {
    if (lutadores[vencedor])
      lutadores[vencedor].defesasCinturao =
        (lutadores[vencedor].defesasCinturao || 0) + 1;
    const idx = cat.lista.indexOf(perdedor);
    if (idx !== -1) {
      cat.lista.splice(idx, 1);
      cat.lista.splice(Math.min(cat.lista.length, idx + 2), 0, perdedor);
    }
    cat.lista = cat.lista.slice(0, MAX);
    return;
  }

  if (!listaCheia) {
    if (!vencedorNaLista && !vencedorNoCampeao) cat.lista.push(vencedor);
    if (!perdedorNaLista && !perdedorNoCampeao) cat.lista.push(perdedor);
  }

  if (listaCheia) {
    if (!vencedorNaLista && !vencedorNoCampeao) {
      if (perdedorNaLista) {
        const idxP = cat.lista.indexOf(perdedor);
        cat.lista.splice(idxP, 1, vencedor);
        cat.lista = cat.lista.slice(0, MAX);
        return;
      }
      return;
    }
  }

  const idxV = cat.lista.indexOf(vencedor);
  const idxP = cat.lista.indexOf(perdedor);

  if (idxV > 0) {
    cat.lista.splice(idxV, 1);
    cat.lista.splice(idxV - 1, 0, vencedor);
  }

  const novoIdxP = cat.lista.indexOf(perdedor);
  if (novoIdxP !== -1 && novoIdxP < cat.lista.length - 1) {
    cat.lista.splice(novoIdxP, 1);
    cat.lista.splice(novoIdxP + 1, 0, perdedor);
  }

  cat.lista = cat.lista.slice(0, MAX);
}

// ══════════════════════════════════════════
//  RECALCULA TUDO DO ZERO
//  (substitui a antiga "sincronizar incremental")
// ══════════════════════════════════════════
function recalcularRanking() {
  const eventos = JSON.parse(localStorage.getItem("eventos")) || [];

  // ordena por id crescente = ordem cronológica de cadastro
  const eventosOrdenados = [...eventos].sort((a, b) => a.id - b.id);

  const rankings = {};
  const lutadores = {};

  eventosOrdenados.forEach((evento) => {
    if (!evento.lutas) return;

    evento.lutas.forEach((luta) => {
      if (!luta.lutador1 || !luta.lutador2 || !luta.categoria) return;

      const cat = luta.categoria;
      const l1 = luta.lutador1.trim();
      const l2 = luta.lutador2.trim();
      const vencedor = (luta.vencedor || "").trim();
      const cinturao = luta.cinturao || "";

      if (!rankings[cat]) rankings[cat] = { campeao: null, lista: [] };

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

      if (vencedor === l1) {
        lutadores[l1].vitorias++;
        lutadores[l2].derrotas++;
        lutadores[l1].sequenciaAtual++;
        lutadores[l2].sequenciaAtual = 0;
        if (lutadores[l1].sequenciaAtual > lutadores[l1].maiorSequencia) {
          lutadores[l1].maiorSequencia = lutadores[l1].sequenciaAtual;
        }
        if (["KO/TKO", "Finalização"].includes(luta.metodo))
          lutadores[l1].finishes++;
        moverRanking(rankings[cat], l1, l2, cinturao, lutadores);
      } else if (vencedor === l2) {
        lutadores[l2].vitorias++;
        lutadores[l1].derrotas++;
        lutadores[l2].sequenciaAtual++;
        lutadores[l1].sequenciaAtual = 0;
        if (lutadores[l2].sequenciaAtual > lutadores[l2].maiorSequencia) {
          lutadores[l2].maiorSequencia = lutadores[l2].sequenciaAtual;
        }
        if (["KO/TKO", "Finalização"].includes(luta.metodo))
          lutadores[l2].finishes++;
        moverRanking(rankings[cat], l2, l1, cinturao, lutadores);
      }
    });
  });

  salvarRankings(rankings);
  salvarLutadores(lutadores);

  // não usamos mais processamento incremental, mas removemos a chave antiga
  // pra não ficar lixo no localStorage
  localStorage.removeItem("lutasProcessadas");
}
