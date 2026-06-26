// ══════════════════════════════════════════
//  RANKING ENGINE v2
//  Lógica baseada no sistema real do UFC
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
//  PONTUAÇÃO DE RANKING (P4P e ordenação)
//  Retorna um score numérico para comparação
// ══════════════════════════════════════════
function calcularScore(lutador, todosLutadores, rankingDaCategoria) {
  const l = lutador;
  const total = (l.vitorias || 0) + (l.derrotas || 0) + (l.empates || 0);
  if (total === 0) return 0;

  let score = 0;

  // ── 1. BASE: vitórias e derrotas ──
  score += (l.vitorias || 0) * 10;
  score -= (l.derrotas || 0) * 6;

  // ── 2. DOMINÂNCIA: qualidade das vitórias ──
  // KO/TKO rápido vale mais que decisão
  score += (l.finishesPrimeiroRound || 0) * 8;  // finish no R1
  score += (l.finishesSegundoRound || 0) * 5;   // finish no R2+
  score += (l.finishesDecisao || 0) * 2;         // decisão unânime
  // finalização tem bônus adicional (submissão = técnica)
  score += (l.finalizacoes || 0) * 2;

  // ── 3. PESO DA VITÓRIA: qualidade do oponente ──
  // quanto mais bem ranqueado o oponente, mais pontos a vitória vale
  (l.historicoVitorias || []).forEach((v) => {
    const posOponente = getPosicaoNoRanking(v.oponente, rankingDaCategoria);
    if (posOponente === "campeao") score += 30;
    else if (posOponente <= 3)     score += 20;
    else if (posOponente <= 5)     score += 15;
    else if (posOponente <= 10)    score += 10;
    else if (posOponente <= 15)    score += 5;
    else                           score += 2;  // não ranqueado
  });

  // ── 4. RECÊNCIA: últimas lutas valem mais ──
  // penaliza inatividade: cada luta "envelhece"
  (l.historicoLutas || []).forEach((luta, i) => {
    const idadeRelativa = (l.historicoLutas.length - 1 - i); // 0 = mais recente
    const decaimento = Math.pow(0.85, idadeRelativa); // 15% de decaimento por luta
    if (luta.resultado === "vitoria") score += 3 * decaimento;
    else if (luta.resultado === "derrota") score -= 2 * decaimento;
  });

  // ── 5. SEQUÊNCIA ATUAL ──
  score += (l.sequenciaAtual || 0) * 4;

  // ── 6. CINTURÃO ──
  score += (l.defesasCinturao || 0) * 15;
  score += (l.conquistasCinturao || 0) * 10;

  // ── 7. ATIVIDADE: bônus por ser ativo ──
  // lutadores com mais lutas recentes ganham leve bônus
  const lutasRecentes = (l.historicoLutas || []).slice(-3).length;
  score += lutasRecentes * 1.5;

  return Math.round(score * 10) / 10;
}

// retorna posição numérica no ranking (1-15), "campeao", ou 99 se não ranqueado
function getPosicaoNoRanking(nome, catRanking) {
  if (!catRanking) return 99;
  if (catRanking.campeao === nome) return "campeao";
  const idx = catRanking.lista.indexOf(nome);
  return idx === -1 ? 99 : idx + 1;
}

// ══════════════════════════════════════════
//  MOVIMENTAÇÃO NO RANKING
// ══════════════════════════════════════════
function moverRanking(cat, vencedor, perdedor, cinturao, lutadores, empate, metodo) {
  const MAX = 15;

  // empate: ninguém se move, mas entram na lista se houver espaço
  if (empate) {
    if (cat.lista.length < MAX) {
      if (!cat.lista.includes(vencedor) && cat.campeao !== vencedor)
        cat.lista.push(vencedor);
      if (!cat.lista.includes(perdedor) && cat.campeao !== perdedor)
        cat.lista.push(perdedor);
    }
    return;
  }

  const ehConquista = ["Cinturão Unificado", "Cinturão Interino", "Cinturão BMF"].includes(cinturao);

  // ── conquista de cinturão ──
  if (ehConquista) {
    cat.lista = cat.lista.filter((n) => n !== vencedor);
    const exCampeao = cat.campeao;
    cat.campeao = vencedor;
    if (lutadores[vencedor])
      lutadores[vencedor].conquistasCinturao = (lutadores[vencedor].conquistasCinturao || 0) + 1;
    if (exCampeao) {
      cat.lista = cat.lista.filter((n) => n !== exCampeao);
      cat.lista.unshift(exCampeao); // ex-campeão vai para #1
    }
    cat.lista = cat.lista.slice(0, MAX);
    return;
  }

  // ── defesa de cinturão ──
  if (cinturao === "Defesa de cinturão") {
    if (lutadores[vencedor])
      lutadores[vencedor].defesasCinturao = (lutadores[vencedor].defesasCinturao || 0) + 1;
    // perdedor cai 2 posições
    const idx = cat.lista.indexOf(perdedor);
    if (idx !== -1) {
      cat.lista.splice(idx, 1);
      cat.lista.splice(Math.min(cat.lista.length, idx + 2), 0, perdedor);
    }
    cat.lista = cat.lista.slice(0, MAX);
    return;
  }

  const vencedorNaLista   = cat.lista.includes(vencedor);
  const vencedorECampeao  = cat.campeao === vencedor;
  const perdedorNaLista   = cat.lista.includes(perdedor);
  const perdedorECampeao  = cat.campeao === perdedor;
  const listaCheia        = cat.lista.length >= MAX;

  // ── lista não cheia: ambos entram ──
  if (!listaCheia) {
    if (!vencedorNaLista && !vencedorECampeao) cat.lista.push(vencedor);
    if (!cat.lista.includes(perdedor) && !perdedorECampeao) cat.lista.push(perdedor);
  }

  // ── lista cheia: não ranqueado só entra ganhando de ranqueado ──
  if (listaCheia && !vencedorNaLista && !vencedorECampeao) {
    if (perdedorNaLista) {
      // movimentação natural: assume a posição do derrotado
      const idxP = cat.lista.indexOf(perdedor);
      cat.lista.splice(idxP, 1, vencedor);
      cat.lista = cat.lista.slice(0, MAX);
    }
    // se perdedor também não é ranqueado, ninguém entra
    return;
  }

  // ── movimentação por posição ──
  const idxV = cat.lista.indexOf(vencedor);
  const idxP = cat.lista.indexOf(perdedor);

  // quanto o vencedor sobe depende da dominância
  const ehFinish = ["KO/TKO", "Finalização"].includes(metodo);
  const subirPosicoes = ehFinish ? 2 : 1; // finish sobe 2, decisão sobe 1

  if (idxV > 0) {
    cat.lista.splice(idxV, 1);
    cat.lista.splice(Math.max(0, idxV - subirPosicoes), 0, vencedor);
  }

  // perdedor desce
  const novoIdxP = cat.lista.indexOf(perdedor);
  if (novoIdxP !== -1 && novoIdxP < cat.lista.length - 1) {
    cat.lista.splice(novoIdxP, 1);
    cat.lista.splice(novoIdxP + 1, 0, perdedor);
  }

  cat.lista = cat.lista.slice(0, MAX);
}

// ══════════════════════════════════════════
//  RECALCULA TUDO DO ZERO
// ══════════════════════════════════════════
function recalcularRanking() {
  const eventos = JSON.parse(localStorage.getItem("eventos")) || [];
  const eventosOrdenados = [...eventos].sort((a, b) => a.id - b.id);

  const rankings  = {};
  const lutadores = {};

  // primeiro passo: constrói stats e histórico completo
  eventosOrdenados.forEach((evento) => {
    if (!evento.lutas) return;

    evento.lutas.forEach((luta) => {
      if (!luta.lutador1 || !luta.lutador2 || !luta.categoria) return;

      const cat      = luta.categoria;
      const l1       = luta.lutador1.trim();
      const l2       = luta.lutador2.trim();
      const vencedor = (luta.vencedor || "").trim();
      const cinturao = luta.cinturao || "";
      const metodo   = luta.metodo || "";
      const empate   = metodo === "Empate";

      if (!rankings[cat]) rankings[cat] = { campeao: null, lista: [] };

      // inicializa lutadores
      [l1, l2].forEach((nome) => {
        if (!lutadores[nome]) {
          lutadores[nome] = {
            nome,
            vitorias: 0,
            derrotas: 0,
            empates: 0,
            finishes: 0,
            finishesPrimeiroRound: 0,
            finishesSegundoRound: 0,
            finishesDecisao: 0,
            finalizacoes: 0,
            defesasCinturao: 0,
            conquistasCinturao: 0,
            sequenciaAtual: 0,
            maiorSequencia: 0,
            categorias: [],
            historicoLutas: [],
            historicoVitorias: [],
          };
        }
        if (!lutadores[nome].categorias.includes(cat))
          lutadores[nome].categorias.push(cat);
      });

      if (empate) {
        lutadores[l1].empates = (lutadores[l1].empates || 0) + 1;
        lutadores[l2].empates = (lutadores[l2].empates || 0) + 1;
        lutadores[l1].historicoLutas.push({ resultado: "empate", oponente: l2, metodo, categoria: cat });
        lutadores[l2].historicoLutas.push({ resultado: "empate", oponente: l1, metodo, categoria: cat });
        moverRanking(rankings[cat], l1, l2, cinturao, lutadores, true, metodo);
        return;
      }

      if (vencedor === l1) {
        lutadores[l1].vitorias++;
        lutadores[l2].derrotas++;
        lutadores[l1].sequenciaAtual++;
        lutadores[l2].sequenciaAtual = 0;
        if (lutadores[l1].sequenciaAtual > lutadores[l1].maiorSequencia)
          lutadores[l1].maiorSequencia = lutadores[l1].sequenciaAtual;

        // dominância: classifica o tipo de vitória
        if (metodo === "KO/TKO") {
          lutadores[l1].finishes++;
          // sem info de round, assume R1 se for KO rápido (futuro: adicionar campo round)
          lutadores[l1].finishesPrimeiroRound++;
        } else if (metodo === "Finalização") {
          lutadores[l1].finishes++;
          lutadores[l1].finalizacoes++;
          lutadores[l1].finishesSegundoRound++;
        } else if (metodo === "Decisão") {
          lutadores[l1].finishesDecisao++;
        }

        // histórico com contexto
        lutadores[l1].historicoLutas.push({ resultado: "vitoria", oponente: l2, metodo, categoria: cat });
        lutadores[l2].historicoLutas.push({ resultado: "derrota", oponente: l1, metodo, categoria: cat });
        lutadores[l1].historicoVitorias.push({ oponente: l2, metodo, categoria: cat });

        moverRanking(rankings[cat], l1, l2, cinturao, lutadores, false, metodo);

      } else if (vencedor === l2) {
        lutadores[l2].vitorias++;
        lutadores[l1].derrotas++;
        lutadores[l2].sequenciaAtual++;
        lutadores[l1].sequenciaAtual = 0;
        if (lutadores[l2].sequenciaAtual > lutadores[l2].maiorSequencia)
          lutadores[l2].maiorSequencia = lutadores[l2].sequenciaAtual;

        if (metodo === "KO/TKO") {
          lutadores[l2].finishes++;
          lutadores[l2].finishesPrimeiroRound++;
        } else if (metodo === "Finalização") {
          lutadores[l2].finishes++;
          lutadores[l2].finalizacoes++;
          lutadores[l2].finishesSegundoRound++;
        } else if (metodo === "Decisão") {
          lutadores[l2].finishesDecisao++;
        }

        lutadores[l2].historicoLutas.push({ resultado: "vitoria", oponente: l1, metodo, categoria: cat });
        lutadores[l1].historicoLutas.push({ resultado: "derrota", oponente: l2, metodo, categoria: cat });
        lutadores[l2].historicoVitorias.push({ oponente: l1, metodo, categoria: cat });

        moverRanking(rankings[cat], l2, l1, cinturao, lutadores, false, metodo);
      }
    });
  });

  // segundo passo: reordena cada categoria por score final
  // (corrige acúmulo de movimentações ao longo do tempo)
  Object.entries(rankings).forEach(([cat, catData]) => {
    catData.lista.sort((a, b) => {
      const la = lutadores[a] || {};
      const lb = lutadores[b] || {};
      return calcularScore(lb, lutadores, catData) - calcularScore(la, lutadores, catData);
    });
  });

  salvarRankings(rankings);
  salvarLutadores(lutadores);
  localStorage.removeItem("lutasProcessadas");
}