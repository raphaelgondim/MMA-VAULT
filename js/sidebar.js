const eventos = JSON.parse(localStorage.getItem("eventos")) || [];

const totalEventos = eventos.length;

let totalLutas = 0;

eventos.forEach((evento) => {
  totalLutas += evento.lutas.length;
});

const eventosElement = document.getElementById("totalEventosSidebar");

if (eventosElement) {
  eventosElement.textContent = totalEventos;
}

const lutasElement = document.getElementById("totalLutasSidebar");

if (lutasElement) {
  lutasElement.textContent = totalLutas;
}

// Cola esse trecho no final do seu sidebar.js existente
(function () {
  const atual = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".sidebar nav a").forEach((link) => {
    const href = link.getAttribute("href").split("/").pop();
    if (href === atual) {
      link.classList.add("ativa");
    }
  });
})();