const params = new URLSearchParams(location.search);

const eventoId = Number(params.get("evento"));

const lutaId = Number(params.get("luta"));

const eventos = JSON.parse(localStorage.getItem("eventos")) || [];

const evento = eventos.find((e) => e.id === eventoId);

const luta = evento.lutas.find((l) => l.id === lutaId);

const container = document.getElementById("containerLuta");

container.innerHTML = `

<div class="container">

<div class="card">

<h1>

${luta.lutador1}

vs

${luta.lutador2}

</h1>

<p>

Vencedor:
${luta.vencedor}

</p>

<p>

Método:
${luta.metodo}

</p>

<br>

<label>Nota</label>

<select id="nota">

<option value="0">0</option>
<option value="0.5">0.5</option>
<option value="1">1</option>
<option value="1.5">1.5</option>
<option value="2">2</option>
<option value="2.5">2.5</option>
<option value="3">3</option>
<option value="3.5">3.5</option>
<option value="4">4</option>
<option value="4.5">4.5</option>
<option value="5">5</option>

</select>

<label>Review</label>

<textarea id="review">

${luta.review || ""}

</textarea>

<button id="salvar">

Salvar Avaliação

</button>

</div>

</div>
`;

document.getElementById("salvar").addEventListener("click", () => {
  luta.nota = Number(document.getElementById("nota").value);

  luta.review = document.getElementById("review").value;

  luta.avaliada = true;

  localStorage.setItem("eventos", JSON.stringify(eventos));

  alert("Avaliação salva!");
});
