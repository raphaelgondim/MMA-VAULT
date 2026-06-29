document.addEventListener("DOMContentLoaded", () => {
  const POR_PAGINA = 20;
  let paginaAtual = 1;
  let lutadoresFiltrados = [];
  let lutadorAberto = null;
  let fotoBase64 = "";

  // ── coleta lutadores dos eventos e mescla com perfis salvos ──
  function coletarLutadores() {
    const eventos = JSON.parse(localStorage.getItem("eventos")) || [];
    const perfis = JSON.parse(localStorage.getItem("perfisLutadores")) || {};
    const mapa = {};

    eventos.forEach((evento) => {
      if (!evento.lutas) return;

      evento.lutas.forEach((luta) => {
        [luta.lutador1, luta.lutador2].forEach((nome) => {
          if (!nome || !nome.trim()) return;
          const n = nome.trim();
          if (!mapa[n]) {
            mapa[n] = {
              nome: n,
              vitorias: 0,
              derrotas: 0,
              empates: 0,
              kos: 0,
              finalizacoes: 0,
              decisoes: 0,
              desqualificacoes: 0,
              notasLutas: [],
              foiCampeao: false,
              historico: [],
            };
          }
        });

        if (!luta.lutador1 || !luta.lutador2) return;

        const l1 = luta.lutador1.trim();
        const l2 = luta.lutador2.trim();
        const vencedor = (luta.vencedor || "").trim();
        const metodo = luta.metodo || "";
        const empate = metodo === "Empate";
        const cinturao = luta.cinturao || "";

        // cinturão
        if (
          [
            "Cinturão Unificado",
            "Cinturão Interino",
            "Cinturão BMF",
            "Defesa de cinturão",
          ].includes(cinturao)
        ) {
          if (vencedor === l1) mapa[l1].foiCampeao = true;
          if (vencedor === l2) mapa[l2].foiCampeao = true;
        }

        // stats e histórico
        const registrarLuta = (lutador, oponente, resultado) => {
          if (luta.nota) mapa[lutador].notasLutas.push(luta.nota);

          if (resultado === "v") {
            mapa[lutador].vitorias++;
            if (metodo === "KO/TKO") mapa[lutador].kos++;
            else if (metodo === "Finalização") mapa[lutador].finalizacoes++;
            else if (metodo === "Decisão") mapa[lutador].decisoes++;
            else if (metodo === "Desqualificação")
              mapa[lutador].desqualificacoes++;
          } else if (resultado === "d") {
            mapa[lutador].derrotas++;
          } else {
            mapa[lutador].empates++;
          }

          mapa[lutador].historico.push({
            oponente,
            resultado,
            metodo,
            categoria: luta.categoria || "",
            nota: luta.nota || null,
            evento: evento.nome || "",
            data: evento.data || "",
          });
        };

        if (empate) {
          registrarLuta(l1, l2, "e");
          registrarLuta(l2, l1, "e");
        } else if (vencedor === l1) {
          registrarLuta(l1, l2, "v");
          registrarLuta(l2, l1, "d");
        } else if (vencedor === l2) {
          registrarLuta(l2, l1, "v");
          registrarLuta(l1, l2, "d");
        } else {
          // sem vencedor definido — só registra a luta
          registrarLuta(l1, l2, "?");
          registrarLuta(l2, l1, "?");
        }
      });
    });

    // mescla com perfis manuais
    Object.keys(mapa).forEach((nome) => {
      if (perfis[nome]) {
        mapa[nome].foto = perfis[nome].foto || "";
        mapa[nome].nacionalidade = perfis[nome].nacionalidade || "";
      }
    });

    return Object.values(mapa);
  }

  // ── ordena e filtra ──
  function aplicarFiltros(lista) {
    const termo = document
      .getElementById("pesquisa")
      .value.toLowerCase()
      .trim();
    const ordem = document.getElementById("ordenacao").value;

    let resultado = termo
      ? lista.filter((l) => l.nome.toLowerCase().includes(termo))
      : [...lista];

    if (ordem === "alfa") {
      resultado.sort((a, b) => a.nome.localeCompare(b.nome));
    } else if (ordem === "vitorias") {
      resultado.sort((a, b) => b.vitorias - a.vitorias);
    } else if (ordem === "lutas") {
      resultado.sort(
        (a, b) =>
          b.vitorias +
          b.derrotas +
          b.empates -
          (a.vitorias + a.derrotas + a.empates),
      );
    } else if (ordem === "nota") {
      resultado.sort((a, b) => {
        const ma = a.notasLutas.length
          ? a.notasLutas.reduce((s, n) => s + n, 0) / a.notasLutas.length
          : 0;
        const mb = b.notasLutas.length
          ? b.notasLutas.reduce((s, n) => s + n, 0) / b.notasLutas.length
          : 0;
        return mb - ma;
      });
    }

    return resultado;
  }

  // ── renderiza grid ──
  function renderGrid() {
    const todos = coletarLutadores();
    lutadoresFiltrados = aplicarFiltros(todos);

    const grid = document.getElementById("gridLutadores");
    const paginacao = document.getElementById("paginacao");
    grid.innerHTML = "";
    paginacao.innerHTML = "";

    if (lutadoresFiltrados.length === 0) {
      grid.innerHTML = `<p class="vazio">Nenhum lutador encontrado.</p>`;
      return;
    }

    const totalPaginas = Math.ceil(lutadoresFiltrados.length / POR_PAGINA);
    const inicio = (paginaAtual - 1) * POR_PAGINA;
    const pagina = lutadoresFiltrados.slice(inicio, inicio + POR_PAGINA);

    pagina.forEach((l) => {
      const iniciais = l.nome
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
      const mediaNota = l.notasLutas.length
        ? (
            l.notasLutas.reduce((s, n) => s + n, 0) / l.notasLutas.length
          ).toFixed(1)
        : null;

      const avatarHTML = l.foto
        ? `<img src="${l.foto}" alt="${l.nome}">`
        : iniciais;

      const card = document.createElement("div");
      card.classList.add("lutador-card");
      card.dataset.nome = l.nome;
      card.innerHTML = `
        <div class="lc-avatar">${avatarHTML}</div>
        <div class="lc-nome">${l.nome}</div>
        ${l.nacionalidade ? `<div class="lc-pais">${l.nacionalidade}</div>` : ""}
        <div class="lc-record">
          <strong>${l.vitorias}V</strong> ${l.derrotas}D ${l.empates ? l.empates + "E" : ""}
        </div>
        <div class="lc-badges">
          ${l.foiCampeao ? `<span class="lc-badge campeao">👑 Campeão</span>` : ""}
          ${mediaNota ? `<span class="lc-badge">⭐ ${mediaNota}</span>` : ""}
          ${l.kos > 0 ? `<span class="lc-badge">${l.kos} KO</span>` : ""}
        </div>
      `;

      card.addEventListener("click", () => abrirModal(l.nome));
      grid.appendChild(card);
    });

    // paginação
    for (let i = 1; i <= totalPaginas; i++) {
      const btn = document.createElement("button");
      btn.classList.add("btn-pag");
      if (i === paginaAtual) btn.classList.add("ativa");
      btn.textContent = i;
      btn.addEventListener("click", () => {
        paginaAtual = i;
        renderGrid();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      paginacao.appendChild(btn);
    }
  }

  // ── abre modal do lutador ──
  function abrirModal(nome) {
    const todos = coletarLutadores();
    const l = todos.find((x) => x.nome === nome);
    if (!l) return;

    lutadorAberto = nome;
    fotoBase64 = l.foto || "";

    // header
    const iniciais = nome
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
    const avatarEl = document.getElementById("modalAvatar");
    avatarEl.innerHTML = l.foto
      ? `<img src="${l.foto}" alt="${nome}">`
      : iniciais;

    document.getElementById("modalNome").textContent = nome;
    document.getElementById("modalApelido").textContent = l.nacionalidade || "";

    // stats
    const mediaNota = l.notasLutas.length
      ? (l.notasLutas.reduce((s, n) => s + n, 0) / l.notasLutas.length).toFixed(
          1,
        )
      : "—";

    const totalLutas = l.vitorias + l.derrotas + l.empates;
    const finishRate =
      l.vitorias > 0
        ? Math.round(((l.kos + l.finalizacoes) / l.vitorias) * 100)
        : 0;

    document.getElementById("statsGrid").innerHTML = `
      <div class="stat-box">
        <span class="stat-box-valor">${l.vitorias}V ${l.derrotas}D</span>
        <span class="stat-box-label">Recorde</span>
      </div>
      <div class="stat-box">
        <span class="stat-box-valor">${totalLutas}</span>
        <span class="stat-box-label">Lutas</span>
      </div>
      <div class="stat-box">
        <span class="stat-box-valor">${finishRate}%</span>
        <span class="stat-box-label">Finish rate</span>
      </div>
      <div class="stat-box">
        <span class="stat-box-valor">${mediaNota}</span>
        <span class="stat-box-label">Nota média</span>
      </div>
      <div class="stat-box">
        <span class="stat-box-valor">${l.kos}</span>
        <span class="stat-box-label">KO/TKO</span>
      </div>
      <div class="stat-box">
        <span class="stat-box-valor">${l.finalizacoes}</span>
        <span class="stat-box-label">Finalizações</span>
      </div>
      <div class="stat-box">
        <span class="stat-box-valor">${l.decisoes}</span>
        <span class="stat-box-label">Decisões</span>
      </div>
      <div class="stat-box">
        <span class="stat-box-valor">${l.empates}</span>
        <span class="stat-box-label">Empates</span>
      </div>
    `;

    // histórico
    const hist = document.getElementById("historicoLutas");
    hist.innerHTML = "";

    if (l.historico.length === 0) {
      hist.innerHTML = `<p style="color:#4b5563;font-style:italic;font-size:0.85rem">Sem lutas registradas.</p>`;
    } else {
      // ordena por data decrescente
      const ordenado = [...l.historico].sort((a, b) => {
        if (!a.data && !b.data) return 0;
        if (!a.data) return 1;
        if (!b.data) return -1;
        return new Date(b.data) - new Date(a.data);
      });

      ordenado.forEach((h) => {
        const resLabel =
          h.resultado === "v"
            ? "V"
            : h.resultado === "d"
              ? "D"
              : h.resultado === "e"
                ? "E"
                : "?";
        const notaHTML = h.nota ? `· ⭐ ${h.nota}` : "";
        hist.innerHTML += `
          <div class="hist-item">
            <div class="hist-resultado ${h.resultado}">${resLabel}</div>
            <div class="hist-info">
              <div class="hist-oponente">${h.oponente}</div>
              <div class="hist-detalhe">${h.metodo || "—"} · ${h.categoria || "—"} ${notaHTML}</div>
            </div>
            <div class="hist-evento">${h.evento}<br>${formatarData(h.data)}</div>
          </div>
        `;
      });
    }

    // editar perfil — preenche campos
    document.getElementById("inputNacionalidade").value = l.nacionalidade || "";

    document.getElementById("modalOverlay").classList.add("aberto");
  }

  // ── salva perfil manual ──
  document.getElementById("btnSalvarPerfil").addEventListener("click", () => {
    if (!lutadorAberto) return;
    const perfis = JSON.parse(localStorage.getItem("perfisLutadores")) || {};
    perfis[lutadorAberto] = {
      foto: fotoBase64,
      nacionalidade: document.getElementById("inputNacionalidade").value.trim(),
    };
    localStorage.setItem("perfisLutadores", JSON.stringify(perfis));
    document.getElementById("modalOverlay").classList.remove("aberto");
    renderGrid();
  });

  // ── upload de foto ──
  document.getElementById("inputFoto").addEventListener("change", function () {
    const arquivo = this.files[0];
    if (!arquivo) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      fotoBase64 = e.target.result;
      // atualiza avatar no modal em tempo real
      const avatarEl = document.getElementById("modalAvatar");
      avatarEl.innerHTML = `<img src="${fotoBase64}" alt="foto">`;
    };
    reader.readAsDataURL(arquivo);
  });

  // ── fecha modal ──
  document.getElementById("btnFechar").addEventListener("click", () => {
    document.getElementById("modalOverlay").classList.remove("aberto");
  });
  document.getElementById("modalOverlay").addEventListener("click", (e) => {
    if (e.target === document.getElementById("modalOverlay")) {
      document.getElementById("modalOverlay").classList.remove("aberto");
    }
  });

  // ── filtros ──
  document.getElementById("pesquisa").addEventListener("input", () => {
    paginaAtual = 1;
    renderGrid();
  });
  document.getElementById("ordenacao").addEventListener("change", () => {
    paginaAtual = 1;
    renderGrid();
  });

  // ── helper data ──
  function formatarData(dataISO) {
    if (!dataISO) return "";
    const [ano, mes, dia] = dataISO.split("-");
    const meses = [
      "jan",
      "fev",
      "mar",
      "abr",
      "mai",
      "jun",
      "jul",
      "ago",
      "set",
      "out",
      "nov",
      "dez",
    ];
    return `${dia} ${meses[Number(mes) - 1]} ${ano}`;
  }

  // ── init ──
  renderGrid();
});
