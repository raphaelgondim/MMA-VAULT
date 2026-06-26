// ══════════════════════════════════════════
//  CLOUD SYNC (Firebase) — backup automático
//  Sincroniza apenas "eventos" (rankings/lutadores
//  são recalculados localmente a partir disso)
// ══════════════════════════════════════════

// 1) COLE AQUI o firebaseConfig que o console te deu:
const firebaseConfig = {
  apiKey: "AIzaSyAzEvTT_Mkk6kRoQJvn11eJzxvaG1Rjfb8",
  authDomain: "mma-vault-15733.firebaseapp.com",
  projectId: "mma-vault-15733",
  storageBucket: "mma-vault-15733.firebasestorage.app",
  messagingSenderId: "1066691284173",
  appId: "1:1066691284173:web:4725ce840802e2804c2d84",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let _uid = null;
let _pronto = false;
let _filaDeEspera = [];

// ── chamada na inicialização de cada página ──
// callback() é chamado depois que a sincronização inicial terminar
function iniciarNuvem(callback) {
  firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) {
      firebase.auth().signInAnonymously().catch((e) => {
        console.error("Erro ao autenticar anonimamente:", e);
        mostrarStatusNuvem("erro");
      });
      return;
    }

    _uid = user.uid;
    mostrarStatusNuvem("sincronizando");

    try {
      await _sincronizarNaInicializacao();
      mostrarStatusNuvem("ok");
    } catch (e) {
      console.error("Erro ao sincronizar com a nuvem:", e);
      mostrarStatusNuvem("erro");
    }

    _pronto = true;
    if (callback) callback();
    _filaDeEspera.forEach((fn) => fn());
    _filaDeEspera = [];
  });
}

async function _sincronizarNaInicializacao() {
  const ref = db.collection("backups").doc(_uid);
  const snap = await ref.get();

  const localEventos = JSON.parse(localStorage.getItem("eventos")) || [];
  const localAtualizado = Number(localStorage.getItem("eventosAtualizadoEm")) || 0;

  if (snap.exists) {
    const dados = snap.data();
    const nuvemEventos = dados.eventos || [];
    const nuvemAtualizado = dados.atualizadoEm || 0;

    if (nuvemAtualizado > localAtualizado) {
      // nuvem é mais recente → usa ela
      localStorage.setItem("eventos", JSON.stringify(nuvemEventos));
      localStorage.setItem("eventosAtualizadoEm", String(nuvemAtualizado));
      if (typeof recalcularRanking === "function") recalcularRanking();
    } else if (localAtualizado > nuvemAtualizado && localEventos.length > 0) {
      // local é mais recente → manda pra nuvem
      await salvarEventosNaNuvem();
    }
  } else if (localEventos.length > 0) {
    // não existe backup ainda → cria a partir do que já tem localmente
    await salvarEventosNaNuvem();
  }
}

// ── chame isso depois de QUALQUER alteração em localStorage("eventos") ──
async function salvarEventosNaNuvem() {
  const executar = async () => {
    if (!_uid) return;
    const eventos = JSON.parse(localStorage.getItem("eventos")) || [];
    const agora = Date.now();
    localStorage.setItem("eventosAtualizadoEm", String(agora));

    mostrarStatusNuvem("salvando");
    try {
      await db.collection("backups").doc(_uid).set({
        eventos,
        atualizadoEm: agora,
      });
      mostrarStatusNuvem("ok");
    } catch (e) {
      console.error("Erro ao salvar backup na nuvem:", e);
      mostrarStatusNuvem("erro");
    }
  };

  if (!_pronto) {
    _filaDeEspera.push(executar);
    return;
  }
  await executar();
}

// ── indicador visual simples (opcional, cria sozinho se não existir) ──
function mostrarStatusNuvem(estado) {
  let el = document.getElementById("statusNuvem");
  if (!el) {
    el = document.createElement("div");
    el.id = "statusNuvem";
    el.style.position = "fixed";
    el.style.bottom = "12px";
    el.style.right = "12px";
    el.style.padding = "6px 12px";
    el.style.borderRadius = "8px";
    el.style.fontSize = "12px";
    el.style.fontFamily = "sans-serif";
    el.style.zIndex = "9999";
    el.style.transition = "opacity .3s";
    document.body.appendChild(el);
  }

  const estilos = {
    sincronizando: { texto: "🔄 Sincronizando...", cor: "#3b82f6" },
    salvando: { texto: "☁️ Salvando...", cor: "#3b82f6" },
    ok: { texto: "✅ Backup atualizado", cor: "#16a34a" },
    erro: { texto: "⚠️ Falha ao sincronizar", cor: "#dc2626" },
  };

  const s = estilos[estado] || estilos.ok;
  el.textContent = s.texto;
  el.style.background = s.cor;
  el.style.color = "#fff";
  el.style.opacity = "1";

  if (estado === "ok") {
    clearTimeout(el._timeout);
    el._timeout = setTimeout(() => { el.style.opacity = "0"; }, 2000);
  }
}
