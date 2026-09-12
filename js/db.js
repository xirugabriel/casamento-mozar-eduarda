/* =============================================================
   Camada de dados.
   - Se FIREBASE estiver preenchido em config.js -> Cloud Firestore (tempo real)
   - Se estiver vazio                            -> modo local (localStorage)

   Privacidade: a coleção pública `presentes` guarda SÓ o status do presente.
   Nome, mensagem e valor de quem presenteou ficam em `registros`, que apenas
   o admin autenticado consegue ler.
   ============================================================= */
import { FIREBASE } from './config.js?v=202609112027';

const V = '10.12.5';
const U = 'https://www.gstatic.com/firebasejs/' + V;

export const MODO = FIREBASE && FIREBASE.apiKey ? 'firebase' : 'local';

let fb = null;
const ouvintes = new Set();

/* ------------------------------------------------------------------ local */
const LS = {
  get(k, d) { try { const v = JSON.parse(localStorage.getItem('me:' + k)); return v === null ? d : v; } catch (e) { return d; } },
  set(k, v) { localStorage.setItem('me:' + k, JSON.stringify(v)); },
};
const avisar = () => { const p = LS.get('presentes', {}); ouvintes.forEach(f => f(p)); };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/* --------------------------------------------------------------- firebase */
export async function init() {
  if (MODO === 'local') return 'local';
  if (fb) return 'firebase';
  const [appMod, fs, au] = await Promise.all([
    import(U + '/firebase-app.js'),
    import(U + '/firebase-firestore.js'),
    import(U + '/firebase-auth.js'),
  ]);
  const app = appMod.initializeApp(FIREBASE);
  fb = { app, db: fs.getFirestore(app), auth: au.getAuth(app), fs, au };
  return 'firebase';
}

/* ---------------------------------------------------------- presentes/ler */
/** Observa o status de todos os presentes. cb recebe { [id]: {status, ...} } */
export function observarPresentes(cb) {
  if (MODO === 'local') {
    ouvintes.add(cb);
    cb(LS.get('presentes', {}));
    window.addEventListener('storage', avisar);
    return () => ouvintes.delete(cb);
  }
  const fs = fb.fs;
  return fs.onSnapshot(fs.collection(fb.db, 'presentes'), function (snap) {
    const mapa = {};
    snap.forEach(function (d) { mapa[d.id] = d.data(); });
    cb(mapa);
  }, function (err) { console.warn('[presentes]', err); cb({}); });
}

/* ------------------------------------------------------- presentes/gravar */
/** Reserva um presente e registra quem presenteou. */
export async function reservar(presente, dados) {
  const registro = {
    presenteId: presente.id,
    presenteNome: presente.nome,
    nome: dados.nome,
    mensagem: dados.mensagem || '',
    metodo: dados.metodo,                       // 'loja' | 'pix'
    valor: Number(dados.valor) || 0,
    status: dados.metodo === 'pix' ? 'aguardando' : 'reservado',
  };

  if (MODO === 'local') {
    if (!presente.multiplo) {
      const p = LS.get('presentes', {});
      if (p[presente.id] && p[presente.id].status && p[presente.id].status !== 'disponivel') {
        return { ok: false, motivo: 'ocupado' };
      }
      p[presente.id] = { status: 'reservado', metodo: registro.metodo, em: new Date().toISOString() };
      LS.set('presentes', p);
    }
    const regs = LS.get('registros', []);
    regs.unshift(Object.assign({ id: uid(), em: new Date().toISOString() }, registro));
    LS.set('registros', regs);
    avisar();
    return { ok: true };
  }

  const fs = fb.fs;
  try {
    if (!presente.multiplo) {
      await fs.runTransaction(fb.db, async function (tx) {
        const ref = fs.doc(fb.db, 'presentes', presente.id);
        const snap = await tx.get(ref);
        const st = snap.exists() ? snap.data().status : null;
        if (st && st !== 'disponivel') throw new Error('ocupado');
        tx.set(ref, { status: 'reservado', metodo: registro.metodo, em: fs.serverTimestamp() });
      });
    }
    await fs.addDoc(fs.collection(fb.db, 'registros'),
      Object.assign({}, registro, { em: fs.serverTimestamp() }));
    return { ok: true };
  } catch (e) {
    if (String(e && e.message).indexOf('ocupado') > -1) return { ok: false, motivo: 'ocupado' };
    console.error(e);
    return { ok: false, motivo: 'erro' };
  }
}

/* -------------------------------------------------------------------- rsvp */
export async function enviarRsvp(dados) {
  const doc = {
    nome: dados.nome,
    contato: dados.contato || '',
    acompanhantes: Number(dados.acompanhantes) || 0,
    presenca: dados.presenca,                   // 'sim' | 'nao'
    mensagem: dados.mensagem || '',
  };
  if (MODO === 'local') {
    const l = LS.get('rsvps', []);
    l.unshift(Object.assign({ id: uid(), em: new Date().toISOString() }, doc));
    LS.set('rsvps', l);
    return { ok: true };
  }
  try {
    await fb.fs.addDoc(fb.fs.collection(fb.db, 'rsvps'),
      Object.assign({}, doc, { em: fb.fs.serverTimestamp() }));
    return { ok: true };
  } catch (e) { console.error(e); return { ok: false }; }
}

/* ------------------------------------------------------------------- admin */
export async function entrar(email, senha) {
  if (MODO === 'local') { sessionStorage.setItem('me:admin', '1'); return { ok: true }; }
  try {
    await fb.au.signInWithEmailAndPassword(fb.auth, email, senha);
    return { ok: true };
  } catch (e) { return { ok: false, motivo: e.code || 'erro' }; }
}

export async function sair() {
  if (MODO === 'local') { sessionStorage.removeItem('me:admin'); location.reload(); return; }
  await fb.au.signOut(fb.auth);
}

export function observarAuth(cb) {
  if (MODO === 'local') {
    cb(sessionStorage.getItem('me:admin') ? { email: 'modo local' } : null);
    return function () {};
  }
  return fb.au.onAuthStateChanged(fb.auth, cb);
}

const ordenar = (l) => l.slice().sort((a, b) => String(b.em).localeCompare(String(a.em)));
const comData = (d) => {
  const raw = d.data();
  const em = raw.em && raw.em.toDate ? raw.em.toDate().toISOString() : '';
  return Object.assign({ id: d.id }, raw, { em });
};

export async function listarRegistros() {
  if (MODO === 'local') return ordenar(LS.get('registros', []));
  const fs = fb.fs;
  const s = await fs.getDocs(fs.query(fs.collection(fb.db, 'registros'), fs.orderBy('em', 'desc')));
  return s.docs.map(comData);
}

export async function listarRsvps() {
  if (MODO === 'local') return ordenar(LS.get('rsvps', []));
  const fs = fb.fs;
  const s = await fs.getDocs(fs.query(fs.collection(fb.db, 'rsvps'), fs.orderBy('em', 'desc')));
  return s.docs.map(comData);
}

/** Admin: status do presente -> 'disponivel' | 'reservado' | 'recebido' */
export async function definirStatus(presenteId, status) {
  if (MODO === 'local') {
    const p = LS.get('presentes', {});
    if (status === 'disponivel') delete p[presenteId];
    else p[presenteId] = { status, em: new Date().toISOString() };
    LS.set('presentes', p);
    avisar();
    return;
  }
  const fs = fb.fs;
  const ref = fs.doc(fb.db, 'presentes', presenteId);
  if (status === 'disponivel') await fs.deleteDoc(ref);
  else await fs.setDoc(ref, { status, em: fs.serverTimestamp() }, { merge: true });
}

/** Admin: marca um registro como confirmado (Pix caiu / presente chegou). */
export async function atualizarRegistro(id, dados) {
  if (MODO === 'local') {
    const regs = LS.get('registros', []);
    const i = regs.findIndex((r) => r.id === id);
    if (i > -1) regs[i] = Object.assign({}, regs[i], dados);
    LS.set('registros', regs);
    return;
  }
  await fb.fs.updateDoc(fb.fs.doc(fb.db, 'registros', id), dados);
}

export async function excluir(colecao, id) {
  if (MODO === 'local') {
    LS.set(colecao, LS.get(colecao, []).filter((r) => r.id !== id));
    return;
  }
  await fb.fs.deleteDoc(fb.fs.doc(fb.db, colecao, id));
}
