document.addEventListener("DOMContentLoaded", () => {
  const faixaEventos = document.getElementById("faixaEventos");
  const faixaAcontecimentos = document.getElementById("faixaAcontecimentos");
  const modalOverlay = document.getElementById("modalOverlay");
  const btnNovo = document.getElementById("btnNovoAcontecimento");
  const btnFechar = document.getElementById("btnFecharModal");
  const btnCancelar = document.getElementById("btnCancelar");
  const btnSalvar = document.getElementById("btnSalvarAcontecimento");

  // ── abre e fecha modal ──
  btnNovo.addEventListener("click", () => modalOverlay.classList.add("aberto"));
  btnFechar.addEventListener("click", fecharModal);
  btnCancelar.addEventListener("click", fecharModal);
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) fecharModal();
  });

  function fecharModal() {
    modalOverlay.classList.remove("aberto");
    document.getElementById("inputTitulo").value = "";
    document.getElementById("inputData").value = "";
    document.getElementById("inputDescricao").value = "";
  }

  // ── salva acontecimento ──
  btnSalvar.addEventListener("click", () => {
    const titulo = document.getElementById("inputTitulo").value.trim();
    const data = document.getElementById("inputData").value;
    const descricao = document.getElementById("inputDescricao").value.trim();

    if (!titulo || !data) {
      alert("Preencha o título e a data.");
      return;
    }

    const acontecimentos =
      JSON.parse(localStorage.getItem("acontecimentos")) || [];

    acontecimentos.push({
      id: Date.now(),
      titulo,
      data,
      descricao,
    });

    localStorage.setItem("acontecimentos", JSON.stringify(acontecimentos));
    fecharModal();
    renderizar();
  });

  // ── renderiza tudo ──
  function renderizar() {
    const eventos = JSON.parse(localStorage.getItem("eventos")) || [];
    const acontecimentos =
      JSON.parse(localStorage.getItem("acontecimentos")) || [];

    // ordena por data
    const eventosSorted = [...eventos]
      .filter((e) => e.data)
      .sort((a, b) => new Date(a.data) - new Date(b.data));

    const acontecimentosSorted = [...acontecimentos].sort(
      (a, b) => new Date(a.data) - new Date(b.data),
    );

    // ── faixa superior: eventos ──
    faixaEventos.innerHTML = "";

    if (eventosSorted.length === 0) {
      faixaEventos.innerHTML = `<div class="vazio">Nenhum evento registrado ainda.</div>`;
    } else {
      eventosSorted.forEach((evento) => {
        const nota =
          evento.notaEvento && evento.notaEvento !== ""
            ? `<div class="no-nota">⭐ ${evento.notaEvento}/10</div>`
            : "";

        const descricao =
          evento.observacoes && evento.observacoes.trim() !== ""
            ? `<div class="tooltip">${evento.observacoes}</div>`
            : "";

        const no = document.createElement("div");
        no.classList.add("no", "tipo-evento");
        no.innerHTML = `
          <div class="no-card tipo-evento">
            <div class="no-data">${formatarData(evento.data)}</div>
            <div class="no-titulo">${evento.nome}</div>
            ${nota}
            ${descricao}
          </div>
        `;

        // clique leva para o evento
        no.querySelector(".no-card").addEventListener("click", () => {
          location.href = `evento.html?id=${evento.id}`;
        });
        no.querySelector(".no-card").style.cursor = "pointer";

        faixaEventos.appendChild(no);
      });
    }

    // ── faixa inferior: acontecimentos ──
    faixaAcontecimentos.innerHTML = "";

    if (acontecimentosSorted.length === 0) {
      faixaAcontecimentos.innerHTML = `<div class="vazio vazio-inferior">Nenhum acontecimento adicionado ainda.</div>`;
    } else {
      acontecimentosSorted.forEach((ac) => {
        const descricao =
          ac.descricao && ac.descricao.trim() !== ""
            ? `<div class="tooltip">${ac.descricao}</div>`
            : "";

        const no = document.createElement("div");
        no.classList.add("no", "tipo-acontecimento");
        no.innerHTML = `
          <div class="no-card tipo-acontecimento">
            <button class="btn-excluir-no" data-id="${ac.id}" title="Excluir">✕</button>
            <div class="no-data">${formatarData(ac.data)}</div>
            <div class="no-titulo">${ac.titulo}</div>
            ${descricao}
          </div>
        `;

        no.querySelector(".btn-excluir-no").addEventListener("click", (e) => {
          e.stopPropagation();
          excluirAcontecimento(ac.id);
        });

        faixaAcontecimentos.appendChild(no);
      });
    }
  }

  // ── exclui acontecimento ──
  function excluirAcontecimento(id) {
    if (!confirm("Excluir este acontecimento?")) return;

    let acontecimentos =
      JSON.parse(localStorage.getItem("acontecimentos")) || [];
    acontecimentos = acontecimentos.filter((a) => a.id !== id);
    localStorage.setItem("acontecimentos", JSON.stringify(acontecimentos));
    renderizar();
  }

  // ── formata data ──
  function formatarData(dataISO) {
    if (!dataISO) return "—";
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

  renderizar();
});
