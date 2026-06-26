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
