const containerLutas = document.getElementById("containerLutas");
const btnAdicionarLuta = document.getElementById("btnAdicionarLuta");
const form = document.getElementById("formEvento");
const posterInput = document.getElementById("poster");

let contadorLutas = 0;
let posterBase64 = "";

const params = new URLSearchParams(location.search);
const idEditar = params.get("editar");

// — upload do poster
posterInput.addEventListener("change", function () {
  const arquivo = this.files[0];
  if (!arquivo) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    posterBase64 = e.target.result;
    const preview = document.getElementById("previewPoster");
    preview.src = posterBase64;
    preview.style.display = "block";
  };
  reader.readAsDataURL(arquivo);
});

// — adicionar luta
btnAdicionarLuta.addEventListener("click", () => {
  contadorLutas++;
  const div = document.createElement("div");
  div.classList.add("luta-card");

  div.innerHTML = `
    <div class="luta-card-header">
      <h3>Luta ${contadorLutas}</h3>
      <button type="button" class="btn-remover">Remover</button>
    </div>

    <div class="luta-grid">

      <input type="text" class="lutador1" placeholder="Lutador 1">
      <input type="text" class="lutador2" placeholder="Lutador 2">
      <input type="text" class="vencedor" placeholder="Vencedor (deixe vazio se empate)">

      <select class="metodo">
        <option value="">Método</option>
        <option>KO/TKO</option>
        <option>Finalização</option>
        <option>Decisão</option>
        <option>Desqualificação</option>
        <option>Empate</option>
      </select>

      <select class="categoria">
        <option value="">Categoria de peso</option>
        <optgroup label="— Masculino —">
          <option>Peso Mosca (até 56 kg)</option>
          <option>Peso Galo (até 61 kg)</option>
          <option>Peso Pena (até 65 kg)</option>
          <option>Peso Leve (até 70 kg)</option>
          <option>Peso Meio-Médio (até 77 kg)</option>
          <option>Peso Médio (até 83 kg)</option>
          <option>Peso Meio-Pesado (até 93 kg)</option>
          <option>Peso Pesado (até 120 kg)</option>
          <option>Peso Casado</option>
        </optgroup>
        <optgroup label="— Feminino —">
          <option>Feminino Peso Palha (até 52 kg)</option>
          <option>Feminino Peso Mosca (até 56 kg)</option>
          <option>Feminino Peso Galo (até 61 kg)</option>
          <option>Feminino Peso Pena (até 65 kg)</option>
        </optgroup>
      </select>

      <select class="cinturao">
        <option value="">Cinturão</option>
        <option>Sem cinturão</option>
        <option>Cinturão Unificado</option>
        <option>Cinturão Interino</option>
        <option>Cinturão BMF</option>
        <option>Defesa de cinturão</option>
      </select>

      <select class="posicaoCard">
        <option value="">Posição no card</option>
        <option>Main Event</option>
        <option>Co-main Event</option>
        <option>Card Principal</option>
        <option>Prelim</option>
        <option>Early Prelim</option>
      </select>

      <select class="lutaDaNoite">
        <option value="">Luta da Noite</option>
        <option>Fight of the Night</option>
        <option>Performance of the Night</option>
        <option>KO of the Night</option>
        <option>Submission of the Night</option>
      </select>

      <input
        type="number"
        class="notaLuta"
        min="0"
        max="5"
        step="0.5"
        placeholder="Nota da luta (0–5)"
      >

      <textarea class="review full" placeholder="Review da luta"></textarea>

    </div>
  `;

  div.querySelector(".btn-remover").addEventListener("click", () => div.remove());
  containerLutas.appendChild(div);
});

// — carrega dados de edição
iniciarNuvem(() => {
  if (idEditar) {
    const eventos = JSON.parse(localStorage.getItem("eventos")) || [];
    const eventoEditar = eventos.find((e) => e.id === Number(idEditar));

    if (eventoEditar) {
      document.querySelector(".topo h1").textContent = "Editar Evento";
      document.querySelector(".topo p").textContent = "Atualize os dados do evento.";
      document.querySelector(".btn-primario").textContent = "Salvar Alterações";

      document.getElementById("nome").value = eventoEditar.nome || "";
      document.getElementById("numero").value = eventoEditar.numero || "";
      document.getElementById("data").value = eventoEditar.data || "";
      document.getElementById("notaEvento").value = eventoEditar.notaEvento || "";
      document.getElementById("linkEvento").value = eventoEditar.linkEvento || "";
      document.getElementById("linkESPN").value = eventoEditar.linkESPN || "";
      document.getElementById("observacoes").value = eventoEditar.observacoes || "";

      if (eventoEditar.poster) {
        posterBase64 = eventoEditar.poster;
        const preview = document.getElementById("previewPoster");
        preview.src = posterBase64;
        preview.style.display = "block";
      }

      eventoEditar.lutas?.forEach((luta) => {
        btnAdicionarLuta.click();
        const cards = document.querySelectorAll(".luta-card");
        const card = cards[cards.length - 1];
        card.querySelector(".lutador1").value = luta.lutador1 || "";
        card.querySelector(".lutador2").value = luta.lutador2 || "";
        card.querySelector(".vencedor").value = luta.vencedor || "";
        card.querySelector(".metodo").value = luta.metodo || "";
        card.querySelector(".categoria").value = luta.categoria || "";
        card.querySelector(".cinturao").value = luta.cinturao || "";
        card.querySelector(".posicaoCard").value = luta.posicaoCard || "";
        card.querySelector(".lutaDaNoite").value = luta.lutaDaNoite || "";
        card.querySelector(".notaLuta").value = luta.nota || "";
        card.querySelector(".review").value = luta.review || "";
      });
    }
  }
});

// — submit
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const lutas = [];

  document.querySelectorAll(".luta-card").forEach((luta) => {
    lutas.push({
      id: Date.now() + Math.random(),
      lutador1: luta.querySelector(".lutador1").value,
      lutador2: luta.querySelector(".lutador2").value,
      vencedor: luta.querySelector(".vencedor").value,
      metodo: luta.querySelector(".metodo").value,
      categoria: luta.querySelector(".categoria").value,
      cinturao: luta.querySelector(".cinturao").value,
      posicaoCard: luta.querySelector(".posicaoCard").value,
      lutaDaNoite: luta.querySelector(".lutaDaNoite").value,
      nota: parseFloat(luta.querySelector(".notaLuta").value) || null,
      review: luta.querySelector(".review").value,
      avaliada: false,
    });
  });

  const evento = {
    nome: document.getElementById("nome").value,
    numero: document.getElementById("numero").value,
    data: document.getElementById("data").value,
    linkEvento: document.getElementById("linkEvento").value,
    linkESPN: document.getElementById("linkESPN").value,
    notaEvento: document.getElementById("notaEvento").value,
    observacoes: document.getElementById("observacoes").value,
    poster: posterBase64,
    assistiriaNovamente: false,
    lutas: lutas,
  };

  let eventos = JSON.parse(localStorage.getItem("eventos")) || [];

  if (idEditar) {
    eventos = eventos.map((e) =>
      e.id === Number(idEditar) ? { ...evento, id: Number(idEditar) } : e
    );
    localStorage.setItem("eventos", JSON.stringify(eventos));
    recalcularRanking();
    salvarEventosNaNuvem();
    alert("Evento atualizado!");
    location.href = "eventos.html";
  } else {
    evento.id = Date.now();
    eventos.push(evento);
    localStorage.setItem("eventos", JSON.stringify(eventos));
    recalcularRanking();
    salvarEventosNaNuvem();
    alert("Evento salvo!");
    form.reset();
    containerLutas.innerHTML = "";
    contadorLutas = 0;
    document.getElementById("previewPoster").style.display = "none";
    posterBase64 = "";
  }
});