document.addEventListener("DOMContentLoaded", () => {
  const eventos = JSON.parse(localStorage.getItem("eventos")) || [];

  // ── totais ──
  document.getElementById("totalEventos").textContent = eventos.length;

  const totalLutas = eventos.reduce(
    (acc, e) => acc + (e.lutas?.length || 0),
    0,
  );
  document.getElementById("totalLutas").textContent = totalLutas;

  // ── média dos eventos ──
  const comNota = eventos.filter((e) => e.notaEvento && e.notaEvento !== "");
  const media =
    comNota.length > 0
      ? (
          comNota.reduce((acc, e) => acc + Number(e.notaEvento), 0) /
          comNota.length
        ).toFixed(1)
      : "—";
  document.getElementById("mediaEventos").textContent =
    media !== "—" ? `${media}/10` : "—";

  // ── melhor evento ──
  const melhor = [...eventos]
    .filter((e) => e.notaEvento && e.notaEvento !== "")
    .sort((a, b) => Number(b.notaEvento) - Number(a.notaEvento))[0];
  document.getElementById("melhorEvento").textContent = melhor
    ? melhor.nome
    : "—";
  document.getElementById("notaMelhor").textContent = melhor
    ? `⭐ ${melhor.notaEvento}/10`
    : "";

  // ── últimos 5 eventos ──
  const lista = document.getElementById("listaEventos");

  if (eventos.length === 0) {
    lista.innerHTML = `<p class="vazio">Nenhum evento cadastrado ainda.</p>`;
    return;
  }

  const ultimos = [...eventos].reverse().slice(0, 5);

  ultimos.forEach((evento) => {
    const nota =
      evento.notaEvento && evento.notaEvento !== ""
        ? `⭐ ${evento.notaEvento}/10`
        : "Sem nota";

    const totalLutasEvento = evento.lutas?.length || 0;

    const poster =
      evento.poster && evento.poster !== ""
        ? `<img src="${evento.poster}" alt="${evento.nome}" class="evento-poster">`
        : `<div class="evento-poster sem-poster">🥊</div>`;

    lista.innerHTML += `
      <div class="evento-item" onclick="location.href='evento.html?id=${evento.id}'" style="cursor:pointer">
        ${poster}
        <div class="evento-info">
          <h3>${evento.nome}</h3>
          <p>${evento.data || "Sem data"} · ${totalLutasEvento} lutas</p>
        </div>
        <div class="evento-nota">${nota}</div>
      </div>
    `;
  });
});
