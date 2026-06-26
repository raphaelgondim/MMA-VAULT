document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("gridEventos");
  if (!grid) return;

  // espera sincronizar com a nuvem antes de renderizar
  iniciarNuvem(() => {
    renderizarEventos(getEventosOrdenados());
  });

  document.getElementById("pesquisa").addEventListener("input", function () {
    const termo = this.value.toLowerCase();
    const filtrados = getEventosOrdenados().filter((e) =>
      e.nome.toLowerCase().includes(termo)
    );
    renderizarEventos(filtrados);
  });

  document.getElementById("ordenacao").addEventListener("change", () => {
    renderizarEventos(getEventosOrdenados());
  });
});

function getEventosOrdenados() {
  const eventos = JSON.parse(localStorage.getItem("eventos")) || [];
  const ordem = document.getElementById("ordenacao").value;

  if (ordem === "novo") return [...eventos].sort((a, b) => b.id - a.id);
  if (ordem === "antigo") return [...eventos].sort((a, b) => a.id - b.id);
  if (ordem === "nota") return [...eventos].sort((a, b) => (b.notaEvento || 0) - (a.notaEvento || 0));

  return eventos;
}

function renderizarEventos(lista) {
  const grid = document.getElementById("gridEventos");
  grid.innerHTML = "";

  if (lista.length === 0) {
    grid.innerHTML = `<p style="color:#9ca3af; padding: 2rem;">Nenhum evento encontrado.</p>`;
    return;
  }

  lista.forEach((evento) => {
    const nota =
      evento.notaEvento && evento.notaEvento !== ""
        ? `${evento.notaEvento}/10`
        : "Sem nota";

    const poster =
      evento.poster && evento.poster !== ""
        ? evento.poster
        : "./img/sem-poster.png";

    const totalLutas = evento.lutas ? evento.lutas.length : 0;

    grid.innerHTML += `
      <div class="evento-card">
        <img
          src="${poster}"
          alt="${evento.nome}"
          onclick="abrirEvento(${evento.id})"
        >
        <div class="evento-info">
          <h3 onclick="abrirEvento(${evento.id})" style="cursor:pointer">${evento.nome}</h3>
          <p>${evento.data || "Sem data"}</p>
          <p>${totalLutas} lutas</p>
          <p class="nota">⭐ ${nota}</p>

          <div class="evento-acoes">
            <button class="btn-editar" onclick="editarEvento(${evento.id})">✏️ Editar</button>
            <button class="btn-excluir" onclick="excluirEvento(${evento.id})">🗑️ Excluir</button>
          </div>
        </div>
      </div>
    `;
  });
}

function abrirEvento(id) {
  location.href = `evento.html?id=${id}`;
}

function editarEvento(id) {
  location.href = `criar-evento.html?editar=${id}`;
}

function excluirEvento(id) {
  const confirmar = confirm("Tem certeza que quer excluir este evento?");
  if (!confirmar) return;

  let eventos = JSON.parse(localStorage.getItem("eventos")) || [];
  eventos = eventos.filter((e) => e.id !== id);
  localStorage.setItem("eventos", JSON.stringify(eventos));

  recalcularRanking();
  salvarEventosNaNuvem();

  renderizarEventos(getEventosOrdenados());
}