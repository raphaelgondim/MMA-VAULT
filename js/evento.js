document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(location.search);
  const id = Number(params.get("id"));

  const eventos = JSON.parse(localStorage.getItem("eventos")) || [];
  const evento = eventos.find((e) => e.id === id);

  if (!evento) {
    document.getElementById("nomeEvento").textContent = "Evento não encontrado";
    return;
  }

  // — título e subtítulo
  document.title = evento.nome;
  document.getElementById("nomeEvento").textContent = evento.nome;
  document.getElementById("subtituloEvento").textContent =
    evento.data ? `UFC ${evento.numero || ""} · ${evento.data}` : `UFC ${evento.numero || ""}`;

  // — botão editar
  document.getElementById("btnEditar").href = `criar-evento.html?editar=${evento.id}`;

  // — poster
  if (evento.poster && evento.poster !== "") {
    document.getElementById("posterEvento").src = evento.poster;
  }

  // — dados gerais
  document.getElementById("dataEvento").textContent = evento.data || "—";
  document.getElementById("numeroEvento").textContent =
    evento.numero ? `UFC ${evento.numero}` : "—";
  document.getElementById("totalLutas").textContent =
    evento.lutas ? `${evento.lutas.length} lutas` : "0 lutas";
  document.getElementById("notaEvento").textContent =
    evento.notaEvento && evento.notaEvento !== "" ? `⭐ ${evento.notaEvento}/10` : "Sem nota";
  document.getElementById("observacoesEvento").textContent =
    evento.observacoes && evento.observacoes !== "" ? evento.observacoes : "Sem observações";

  // — link do evento
  if (evento.linkEvento && evento.linkEvento !== "") {
    const linkWrap = document.getElementById("linkWrap");
    const linkEl = document.getElementById("linkEvento");
    linkEl.href = evento.linkEvento;
    linkWrap.style.display = "block";
  }

  // — lutas
  const lista = document.getElementById("listaLutas");

  if (!evento.lutas || evento.lutas.length === 0) {
    lista.innerHTML = `<p style="color:#6b7280; font-style:italic;">Nenhuma luta registrada.</p>`;
    return;
  }

  evento.lutas.forEach((luta, index) => {
    const vencedor = luta.vencedor?.trim().toLowerCase();
    const lut1 = luta.lutador1?.trim().toLowerCase();
    const lut2 = luta.lutador2?.trim().toLowerCase();

    const isVencedor1 = vencedor && vencedor === lut1;
    const isVencedor2 = vencedor && vencedor === lut2;

    const nota = luta.nota ? `<strong>${luta.nota}/5</strong>` : "Sem nota";
    const review = luta.review && luta.review.trim() !== ""
      ? `<p class="luta-review">${luta.review}</p>`
      : `<p class="luta-sem-review">Sem review</p>`;

    const linkESPN = luta.linkESPN && luta.linkESPN.trim() !== ""
      ? `<a href="${luta.linkESPN}" target="_blank" class="luta-link">🔗 Ver no ESPN</a>`
      : "";

    lista.innerHTML += `
      <div class="luta-card">
        <div class="luta-header">
          <span class="luta-numero">Luta ${index + 1}</span>
          <span class="luta-metodo">${luta.metodo || "—"}</span>
        </div>

        <div class="luta-confronto">
          <div class="lutador ${isVencedor1 ? "vencedor" : ""}">
            <div class="lutador-nome">${luta.lutador1 || "—"}</div>
            <div class="lutador-label">${isVencedor1 ? "✓ Vencedor" : "Lutador"}</div>
          </div>

          <span class="vs">VS</span>

          <div class="lutador ${isVencedor2 ? "vencedor" : ""}">
            <div class="lutador-nome">${luta.lutador2 || "—"}</div>
            <div class="lutador-label">${isVencedor2 ? "✓ Vencedor" : "Lutador"}</div>
          </div>
        </div>

        <hr class="luta-divider">

        <div class="luta-extras">
          <div>
            <p class="luta-nota">Nota: ${nota}</p>
            ${linkESPN}
          </div>
          ${review}
        </div>
      </div>
    `;
  });
});