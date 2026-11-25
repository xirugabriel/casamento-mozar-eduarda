/* Lojinha — pagamento dos presentes pela InfinitePay (Checkout Integrado).

   pagar     convidado escolheu o presente → confere preço no servidor, segura o
             presente por RESERVA_MIN minutos e devolve o link de pagamento
   webhook   a InfinitePay avisa um pagamento (o aviso NÃO é assinado)
   confirmar o convidado voltou ao convite com os dados do pagamento na URL

   webhook e confirmar só dão baixa depois de perguntar à InfinitePay
   (/payment_check) se o pagamento é real. Os dois podem chegar; dar baixa é idempotente.

   Configuração:
     functions/.env                          INFINITEPAY_HANDLE=<InfiniteTag sem o $>
     firebase functions:secrets:set INFINITEPAY_API_KEY   (a chave inchk_..., digitada por vocês)
*/
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret, defineString } from 'firebase-functions/params';
import { logger } from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { PRESENTES } from './data.js';   // cópia de js/data.js feita no predeploy (firebase.json)

initializeApp();
const db = getFirestore();

const CHAVE = defineSecret('INFINITEPAY_API_KEY');
const HANDLE = defineString('INFINITEPAY_HANDLE');
const API = 'https://api.checkout.infinitepay.io';
const REGIAO = 'southamerica-east1';
const RESERVA_MIN = 20;
const ORIGENS = [/^https:\/\/xirugabriel\.github\.io$/, /^http:\/\/localhost(:\d+)?$/];
const SITE = 'https://xirugabriel.github.io/casamento-mozar-eduarda/';

const opcoes = { region: REGIAO, secrets: [CHAVE], maxInstances: 5 };

/** Mesma regra do site (js/db.js · ocupado): pago/recebido ou reserva ainda valendo. */
const ocupado = (st) => !!st && (st.status === 'recebido'
  || (st.status === 'reservado' && (!st.ate || st.ate.toMillis() > Date.now())));

const texto = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

async function infinitepay(caminho, corpo) {
  const r = await fetch(API + caminho, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': CHAVE.value() },
    body: JSON.stringify(corpo),
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`InfinitePay ${caminho} ${r.status}: ${JSON.stringify(json)}`);
  return json;
}

/* ------------------------------------------------------------------ pagar */
export const pagar = onRequest({ ...opcoes, cors: ORIGENS }, async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const b = req.body || {};
  const p = PRESENTES.find((x) => x.id === b.presenteId);
  const nome = texto(b.nome, 120);
  const mensagem = texto(b.mensagem, 600);
  const valor = p && p.tipo === 'livre' ? Math.round(Number(b.valor) * 100) / 100 : p && p.preco;

  if (!p || nome.length < 2) return res.status(400).json({ erro: 'dados' });
  if (!(valor >= 10 && valor <= 10000)) return res.status(400).json({ erro: 'valor' });

  // volta para a página de onde o convidado veio, se for uma origem conhecida
  let volta = SITE;
  try {
    const u = new URL(String(b.volta));
    if (ORIGENS.some((o) => o.test(u.origin))) volta = u.origin + u.pathname;
  } catch { /* volta inválida: usa o site publicado */ }

  const pedido = db.collection('pedidos').doc();
  const ate = Timestamp.fromMillis(Date.now() + RESERVA_MIN * 60e3);
  try {
    await db.runTransaction(async (tx) => {
      const ref = db.doc('presentes/' + p.id);
      if (!p.multiplo) {
        const st = (await tx.get(ref)).data();
        if (ocupado(st)) throw new Error('ocupado');
        tx.set(ref, { status: 'reservado', ate, pedido: pedido.id });
      }
      tx.set(pedido, {
        presenteId: p.id, presenteNome: p.nome, nome, mensagem, valor,
        status: 'pendente', criadoEm: FieldValue.serverTimestamp(),
      });
    });
  } catch (e) {
    if (e.message === 'ocupado') return res.status(409).json({ erro: 'ocupado' });
    throw e;
  }

  try {
    const link = await infinitepay('/links', {
      handle: HANDLE.value(),
      items: [{ quantity: 1, price: Math.round(valor * 100), description: p.nome }],
      order_nsu: pedido.id,
      redirect_url: volta,
      webhook_url: `https://${REGIAO}-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/webhook`,
      // o link morre junto com a reserva: ninguém paga um presente que já voltou para a lista
      options: { single_payment: true, valid_until: ate.toDate().toISOString() },
    });
    // shortcut: a documentação não diz o nome do campo com a URL; o 1º teste real confirma
    const url = link.url || link.link || link.checkout_url || link.payment_url;
    if (!url) throw new Error('resposta sem URL: ' + JSON.stringify(link));
    await pedido.update({ link: url });
    return res.json({ url });
  } catch (e) {
    logger.error('[pagar]', e);
    await pedido.update({ status: 'erro' });
    if (!p.multiplo) {   // devolve o presente, se a reserva ainda for deste pedido
      await db.runTransaction(async (tx) => {
        const ref = db.doc('presentes/' + p.id);
        if ((await tx.get(ref)).get('pedido') === pedido.id) tx.delete(ref);
      });
    }
    return res.status(502).json({ erro: 'pagamento' });
  }
});

/* ------------------------------------------------------- dar baixa (comum) */
async function darBaixa({ order_nsu, transaction_nsu, slug, receipt_url }) {
  if (!order_nsu || !transaction_nsu || !slug) return null;
  const ref = db.collection('pedidos').doc(String(order_nsu));
  const snap = await ref.get();
  if (!snap.exists) return null;
  if (snap.get('status') === 'pago') return snap.data();

  const r = await infinitepay('/payment_check', {
    handle: HANDLE.value(), order_nsu: String(order_nsu),
    transaction_nsu: String(transaction_nsu), slug: String(slug),
  });
  if (!r.success || !r.paid) return null;

  const multiplo = !!(PRESENTES.find((x) => x.id === snap.get('presenteId')) || {}).multiplo;
  await db.runTransaction(async (tx) => {
    const d = (await tx.get(ref)).data();
    if (d.status === 'pago') return;
    const metodo = r.capture_method === 'pix' ? 'pix' : 'cartao';
    tx.update(ref, {
      status: 'pago', metodo, pagoEm: FieldValue.serverTimestamp(),
      valorPago: (r.paid_amount || r.amount || 0) / 100, transacao: String(transaction_nsu),
      recibo: typeof receipt_url === 'string' ? receipt_url : null,
    });
    if (!multiplo) {
      tx.set(db.doc('presentes/' + d.presenteId),
        { status: 'recebido', pedido: ref.id, em: FieldValue.serverTimestamp() });
    }
    // o painel lê "registros": já entra como recebido, sem precisar de Confirmar
    tx.set(db.collection('registros').doc(ref.id), {
      presenteId: d.presenteId, presenteNome: d.presenteNome, nome: d.nome,
      mensagem: d.mensagem, valor: d.valor, metodo, status: 'recebido',
      em: FieldValue.serverTimestamp(),
    });
  });
  return (await ref.get()).data();
}

/* ---------------------------------------------------------------- webhook */
export const webhook = onRequest(opcoes, async (req, res) => {
  const b = req.body || {};
  try {
    await darBaixa({ order_nsu: b.order_nsu, transaction_nsu: b.transaction_nsu,
      slug: b.invoice_slug, receipt_url: b.receipt_url });
    res.status(200).end();               // 200 mesmo se não pago: não é erro, não precisa reenviar
  } catch (e) {
    logger.error('[webhook]', e);
    res.status(500).end();               // falha de verdade: a InfinitePay tenta de novo
  }
});

/* -------------------------------------------------------------- confirmar */
export const confirmar = onRequest({ ...opcoes, cors: ORIGENS }, async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const d = await darBaixa(req.body || {});
  res.json(d ? { pago: true, presente: d.presenteNome, nome: d.nome } : { pago: false });
});
