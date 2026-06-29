document.addEventListener("DOMContentLoaded", () => {
  const eventos = JSON.parse(localStorage.getItem("eventos")) || [];

  if (eventos.length === 0) {
    document.getElementById("numerosGrid").innerHTML =
      `<p class="vazio-stats">Nenhum evento registrado ainda.</p>`;
    return;
  }

  // ── coleta todas as lutas ──
  const todasLutas = eventos.flatMap((e) =>
    (e.lutas || []).map((l) => ({ ...l, eventoData: e.data, eventoNome: e.nome }))
  );

  const totalLutas     = todasLutas.length;
  const totalEventos   = eventos.length;
  const lutasComNota   = todasLutas.filter((l) => l.nota);
  const eventosComNota = eventos.filter((e) => e.notaEvento && e.notaEvento !== "");

  const mediaNotaLuta = lutasComNota.length
    ? (lutasComNota.reduce((s, l) => s + l.nota, 0) / lutasComNota.length).toFixed(1)
    : "—";

  const mediaNotaEvento = eventosComNota.length
    ? (eventosComNota.reduce((s, e) => s + Number(e.notaEvento), 0) / eventosComNota.length).toFixed(1)
    : "—";

  const finishes = todasLutas.filter((l) =>
    ["KO/TKO", "Finalização"].includes(l.metodo)
  ).length;

  const finishRate = totalLutas > 0
    ? Math.round((finishes / totalLutas) * 100)
    : 0;

  // ── números de destaque ──
  const numeros = [
    { valor: totalEventos, label: "Eventos" },
    { valor: totalLutas, label: "Lutas" },
    { valor: mediaNotaEvento, label: "Nota média eventos" },
    { valor: mediaNotaLuta, label: "Nota média lutas" },
    { valor: finishRate + "%", label: "Finish rate" },
    { valor: finishes, label: "Finishes totais" },
  ];

  document.getElementById("numerosGrid").innerHTML = numeros.map((n) => `
    <div class="numero-card">
      <span class="numero-valor">${n.valor}</span>
      <span class="numero-label">${n.label}</span>
    </div>
  `).join("");

  // ── helper: renderiza barras verticais ──
  function renderBarrasV(containerId, dados, cor) {
    const container = document.getElementById(containerId);
    if (!dados.length) { container.innerHTML = `<p style="color:#4b5563;font-style:italic;font-size:0.8rem">Sem dados.</p>`; return; }
    const max = Math.max(...dados.map((d) => d.valor));
    container.innerHTML = dados.map((d) => {
      const pct = max > 0 ? Math.round((d.valor / max) * 100) : 0;
      return `
        <div class="barra-wrap">
          <span class="barra-valor">${d.valor}</span>
          <div class="barra" style="height:${Math.max(pct, 4)}%;background:${cor || "#d20a0a"}" data-valor="${d.valor}"></div>
          <span class="barra-rotulo">${d.rotulo}</span>
        </div>
      `;
    }).join("");
  }

  // ── helper: renderiza barras horizontais ──
  function renderBarrasH(containerId, dados, cor) {
    const container = document.getElementById(containerId);
    if (!dados.length) { container.innerHTML = `<p style="color:#4b5563;font-style:italic;font-size:0.8rem">Sem dados.</p>`; return; }
    const max = Math.max(...dados.map((d) => d.valor));
    container.innerHTML = dados.map((d) => {
      const pct = max > 0 ? Math.round((d.valor / max) * 100) : 0;
      return `
        <div class="barra-h-wrap">
          <span class="barra-h-rotulo">${d.rotulo}</span>
          <div class="barra-h-track">
            <div class="barra-h-fill" style="width:${Math.max(pct, 4)}%;background:${cor || "#d20a0a"}">
              <span class="barra-h-valor">${d.valor}</span>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  // ── métodos de vitória ──
  const contagemMetodos = {};
  todasLutas.forEach((l) => {
    if (!l.metodo || l.metodo === "") return;
    contagemMetodos[l.metodo] = (contagemMetodos[l.metodo] || 0) + 1;
  });

  const dadosMetodos = Object.entries(contagemMetodos)
    .sort((a, b) => b[1] - a[1])
    .map(([rotulo, valor]) => ({ rotulo, valor }));

  renderBarrasV("barrasMetodos", dadosMetodos);

  // ── categorias com mais lutas ──
  const contagemCats = {};
  todasLutas.forEach((l) => {
    if (!l.categoria || l.categoria === "") return;
    // encurta o nome da categoria para caber
    const nome = l.categoria
      .replace("Feminino ", "F. ")
      .replace(" (até ", " (")
      .replace("Peso ", "");
    contagemCats[nome] = (contagemCats[nome] || 0) + 1;
  });

  const dadosCats = Object.entries(contagemCats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([rotulo, valor]) => ({ rotulo, valor }));

  renderBarrasV("barrasCategorias", dadosCats, "#1d4ed8");

  // ── eventos por ano ──
  const contagemAnos = {};
  eventos.forEach((e) => {
    if (!e.data) return;
    const ano = e.data.split("-")[0];
    contagemAnos[ano] = (contagemAnos[ano] || 0) + 1;
  });

  const dadosAnos = Object.entries(contagemAnos)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([rotulo, valor]) => ({ rotulo, valor }));

  renderBarrasH("barrasAnos", dadosAnos, "#d20a0a");

  // ── distribuição de notas dos eventos ──
  // agrupa por faixa: 0-2, 2-4, 4-6, 6-7, 7-8, 8-9, 9-10
  const faixas = [
    { rotulo: "0–2", min: 0, max: 2 },
    { rotulo: "2–4", min: 2, max: 4 },
    { rotulo: "4–6", min: 4, max: 6 },
    { rotulo: "6–7", min: 6, max: 7 },
    { rotulo: "7–8", min: 7, max: 8 },
    { rotulo: "8–9", min: 8, max: 9 },
    { rotulo: "9–10", min: 9, max: 10.1 },
  ];

  const dadosNotas = faixas.map((f) => ({
    rotulo: f.rotulo,
    valor: eventosComNota.filter((e) => {
      const n = Number(e.notaEvento);
      return n >= f.min && n < f.max;
    }).length,
  })).filter((d) => d.valor > 0);

  renderBarrasH("barrasNotas", dadosNotas, "#7c3aed");
});