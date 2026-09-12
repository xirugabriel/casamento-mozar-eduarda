/* =============================================================
   MOZAR & EDUARDA — comportamento do site
   ============================================================= */
import { CASAMENTO } from './config.js?v=202609112009';
import { PRESENTES, CATEGORIAS } from './data.js?v=202609112009';
import { gerarPix, desenharQR } from './pix.js?v=202609112009';
import * as DB from './db.js?v=202609112009';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

const brl = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ------------------------------------------------------------------ toast */
let toastT;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('on');
  clearTimeout(toastT);
  toastT = setTimeout(() => el.classList.remove('on'), 3200);
}

/* -------------------------------------------------------------- revelação */
const observador = new IntersectionObserver((entradas) => {
  entradas.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); observador.unobserve(e.target); }
  });
}, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

const revelar = (raiz = document) => $$('.rv:not(.in)', raiz).forEach((el) => observador.observe(el));

/* -------------------------------------------------------------------- nav */
function nav() {
  const barra = $('#nav');
  new IntersectionObserver(([e]) => barra.classList.toggle('on', !e.isIntersecting),
    { threshold: 0, rootMargin: '-72px 0px 0px 0px' }).observe($('#inicio'));

  const links = $$('#nav a');
  const secoes = links.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  const io = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) => a.classList.toggle('ativo', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  secoes.forEach((s) => io.observe(s));
}

/* ------------------------------------------------------ barras do sistema */
/* O Safari do iPhone pinta a faixa do notch e a da barra de endereço com a
   cor de fundo da página, não com a theme-color declarada. Como o fundo é
   marfim fixo, as barras ficavam marfim mesmo sobre a abertura verde. Aqui a
   cor acompanha a seção que está no topo — e a theme-color vai junto, porque
   em outros navegadores é ela que manda. */
function barrasDoSistema() {
  const meta = document.querySelector('meta[name="theme-color"]');
  const hero = $('#inicio');
  if (!hero) return;
  const VERDE = '#1F3B2E';
  const MARFIM = '#F6EFE7';
  let atual = '';

  function aplicar() {
    const cor = window.scrollY < hero.offsetHeight - 4 ? VERDE : MARFIM;
    if (cor === atual) return;
    atual = cor;
    if (meta) meta.setAttribute('content', cor);
    document.documentElement.style.backgroundColor = cor;
  }

  aplicar();
  window.addEventListener('scroll', aplicar, { passive: true });
  window.addEventListener('resize', aplicar);
}

/* --------------------------------------------------------------- dizeres */
function dizeres() {
  const linhas = (id, lista) => {
    const el = $(id);
    if (!el) return;
    el.innerHTML = lista.map((t) => `<li>${esc(t)}</li>`).join('')
      + '<li class="dizeres__coracao" aria-hidden="true">&#9825;</li>';
  };
  linhas('#dizeres-abertura', CASAMENTO.dizeres.abertura);
  linhas('#dizeres-aquarela', CASAMENTO.dizeres.aquarela);
  $('#credito-frase').textContent = CASAMENTO.fraseCredito || '';
  $('#frase-final').textContent = CASAMENTO.fraseFinal || '';
}

/* ------------------------------------------------------------- contagem */
/** Instante exato do casamento, respeitando o fuso configurado. */
function instanteAlvo() {
  const palpite = Date.parse(CASAMENTO.dataISO + 'T' + CASAMENTO.horaISO + ':00Z');
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: CASAMENTO.fuso, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const p = {};
  fmt.formatToParts(new Date(palpite)).forEach((x) => { if (x.type !== 'literal') p[x.type] = x.value; });
  const comoUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
  return palpite - (comoUTC - palpite);
}

function contagem() {
  const relogio = $('#relogio');
  const rotulo = $('#contagem-rotulo');
  const secao = $('#contagem');
  const completa = CASAMENTO.contagem === 'completa';
  const alvo = instanteAlvo();

  $('#contagem-sub').textContent = CASAMENTO.contagemSub || '';
  secao.classList.toggle('contagem--unica', !completa);
  secao.classList.toggle('contagem--completa', completa);

  const diaLocal = new Intl.DateTimeFormat('en-CA', {
    timeZone: CASAMENTO.fuso, year: 'numeric', month: '2-digit', day: '2-digit',
  });

  const bloco = (n, u) =>
    `<div class="relogio__bloco"><strong class="relogio__n">${n}</strong><span class="relogio__u">${u}</span></div>`;

  function atualizar() {
    const restante = alvo - Date.now();

    if (restante <= 0) {
      rotulo.textContent = 'Obrigado por celebrar';
      relogio.innerHTML = bloco('&#9825;', 'com a gente');
      return;
    }

    if (completa) {
      const s = Math.floor(restante / 1000);
      rotulo.textContent = 'Faltam';
      relogio.innerHTML =
        bloco(Math.floor(s / 86400), 'dias') +
        bloco(Math.floor(s / 3600) % 24, 'horas') +
        bloco(Math.floor(s / 60) % 60, 'minutos') +
        bloco(s % 60, 'segundos');
      return;
    }

    // só dias: conta noites de sono, não frações de dia
    const hoje = diaLocal.format(new Date());
    const d = Math.round(
      (Date.parse(CASAMENTO.dataISO + 'T00:00:00Z') - Date.parse(hoje + 'T00:00:00Z')) / 86400000
    );
    if (d === 0) { rotulo.textContent = 'É'; relogio.innerHTML = bloco('hoje', CASAMENTO.dataLabel); return; }
    rotulo.textContent = 'Faltam';
    relogio.innerHTML = bloco(d, d === 1 ? 'dia' : 'dias');
  }

  atualizar();
  setInterval(atualizar, completa ? 1000 : 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) atualizar(); });
}

/* --------------------------------------------------------------- locais */
const mapsHref = (l) => l.mapsUrl
  || 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent([l.titulo, l.endereco].filter(Boolean).join(', '));

function locais() {
  const c = CASAMENTO.cerimonia;
  const relogio = '<svg class="horarios__ico" viewBox="0 0 24 24" fill="none" stroke="currentColor"'
    + ' stroke-width="1.6" stroke-linecap="round" aria-hidden="true">'
    + '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.3l3.4 2"/></svg>';
  $('#horarios-cerimonia').innerHTML = c.horarios
    .map(([h, t]) => `<li><b>${relogio}${esc(h)}</b><span>${esc(t)}</span></li>`).join('');
  $('#nome-cerimonia').textContent = c.titulo;
  $('#endereco-cerimonia').textContent = c.endereco;
  $('#maps-cerimonia').href = mapsHref(c);
  if (c.imagem) $('#foto-cerimonia').src = c.imagem;

  const r = CASAMENTO.recepcao;
  $('#texto-recepcao').textContent = r.texto;
  $('#nome-recepcao').textContent = r.titulo;
  $('#endereco-recepcao').textContent = r.endereco;
  $('#maps-recepcao').href = mapsHref(r);
  if (r.imagem) $('#foto-recepcao').src = r.imagem;

  const prazo = new Date(Date.parse(CASAMENTO.dataISO + 'T12:00:00Z') - 30 * 86400000);
  $('#prazo-rsvp').textContent = prazo.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

  const zap = CASAMENTO.contato.whatsapp;
  $('#rodape-duvidas').innerHTML = zap
    ? `Alguma dúvida? <a href="https://wa.me/${esc(zap)}" target="_blank" rel="noopener">fale com a gente</a>.`
    : '';
}

/* ------------------------------------------------------------- presentes */
const estado = { status: {}, filtro: 'todos', atual: null, dados: null };

const ocupado = (p) => !p.multiplo && !!(estado.status[p.id] && estado.status[p.id].status
  && estado.status[p.id].status !== 'disponivel');

function cartao(p) {
  const off = ocupado(p);
  const preco = p.tipo === 'livre' ? 'Valor à sua escolha' : brl(p.preco);
  return `
    <article class="presente ${off ? 'presente--ocupado' : ''}">
      <div class="presente__foto">
        <img src="${esc(p.img)}" alt="${esc(p.nome)}" loading="lazy">
        ${off ? '<p class="presente__selo">Presenteado ♡</p>' : ''}
      </div>
      <div class="presente__corpo">
        <h3 class="presente__nome">${esc(p.nome)}</h3>
        <p class="presente__preco">${esc(preco)}</p>
        ${off
          ? '<p class="presente__indisponivel">Já escolhido</p>'
          : `<button class="btn btn--madeira btn--bloco" type="button" data-presentear="${esc(p.id)}">Presentear</button>`}
      </div>
    </article>`;
}

function renderPresentes() {
  const trilho = $('#trilho-presentes');
  const lista = PRESENTES
    .filter((p) => estado.filtro === 'todos' || p.categoria === estado.filtro)
    .sort((a, b) => Number(ocupado(a)) - Number(ocupado(b)));   // disponíveis primeiro

  trilho.innerHTML = lista.length
    ? lista.map(cartao).join('')
    : '<p class="presentes__nota">Nenhum presente nesta categoria.</p>';
  trilho.scrollLeft = 0;
  carrosselAtualizar();
}

function filtros() {
  $('#filtros').innerHTML = CATEGORIAS.map((c) => `
    <button class="filtro" type="button" role="tab" data-cat="${c.id}"
            aria-selected="${c.id === 'todos'}">${esc(c.label)}</button>`).join('');

  $('#filtros').addEventListener('click', (e) => {
    const b = e.target.closest('.filtro');
    if (!b) return;
    estado.filtro = b.dataset.cat;
    $$('#filtros .filtro').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    renderPresentes();
  });
}

/* ---------------------------------------------------------------- carrossel */
function carrosselAtualizar() {
  const trilho = $('#trilho-presentes');
  const pontos = $('#pontos');
  const grade = CASAMENTO.layoutPresentes === 'grade';

  $('#carrossel').classList.toggle('carrossel--grade', grade);
  if (grade) {
    $('#seta-esq').hidden = $('#seta-dir').hidden = true;
    pontos.hidden = true;
    return;
  }

  const paginas = Math.max(1, Math.ceil(trilho.scrollWidth / Math.max(1, trilho.clientWidth) - 0.02));
  const atual = Math.round(trilho.scrollLeft / Math.max(1, trilho.clientWidth));

  $('#seta-esq').disabled = trilho.scrollLeft <= 4;
  $('#seta-dir').disabled = trilho.scrollLeft >= trilho.scrollWidth - trilho.clientWidth - 4;

  pontos.hidden = paginas < 2;
  if (pontos.childElementCount !== paginas) {
    pontos.innerHTML = Array.from({ length: paginas }, (_, i) =>
      `<button class="ponto" type="button" data-pagina="${i}" aria-label="Página ${i + 1}"></button>`).join('');
  }
  $$('.ponto', pontos).forEach((b, i) => b.setAttribute('aria-current', String(i === atual)));
}

function carrossel() {
  const trilho = $('#trilho-presentes');
  const passo = () => trilho.clientWidth * 0.86;

  $('#seta-esq').addEventListener('click', () => trilho.scrollBy({ left: -passo() }));
  $('#seta-dir').addEventListener('click', () => trilho.scrollBy({ left: passo() }));
  $('#pontos').addEventListener('click', (e) => {
    const b = e.target.closest('.ponto');
    if (b) trilho.scrollTo({ left: Number(b.dataset.pagina) * trilho.clientWidth });
  });

  let t;
  trilho.addEventListener('scroll', () => { clearTimeout(t); t = setTimeout(carrosselAtualizar, 90); }, { passive: true });
  window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(carrosselAtualizar, 150); });
}

/* ------------------------------------------------------------------ modal */
const dlg = () => $('#modal-presente');

function passo(nome) {
  ['dados', 'pix', 'loja', 'fim'].forEach((p) => { $('#passo-' + p).hidden = p !== nome; });
  dlg().querySelector('.modal__caixa').scrollTop = 0;
}

function abrirPresente(p) {
  estado.atual = p;
  estado.dados = null;

  $('#modal-titulo').textContent = p.nome;
  $('#modal-valor').textContent = p.tipo === 'livre' ? 'Valor à sua escolha' : brl(p.preco);

  const livre = p.tipo === 'livre';
  const campoValor = $('#campo-valor-livre');
  campoValor.hidden = !livre;
  campoValor.querySelector('input').required = livre;

  const temPix = !!CASAMENTO.pix.chave;
  const temLoja = !!p.link;
  $('#btn-pix').hidden = !temPix;
  $('#btn-loja').hidden = !temLoja;
  $('#ou-loja').hidden = !(temPix && temLoja);
  $('#btn-pix').textContent = temLoja ? 'Presentear com Pix' : 'Presentear';
  $('#erro-presente').textContent = temPix || temLoja
    ? '' : 'Este presente ainda está sendo preparado. Volte em breve ♡';

  $('#form-presente').reset();
  passo('dados');
  dlg().showModal();
}

function lerFormulario() {
  const f = $('#form-presente');
  const nome = f.nome.value.trim();
  const mensagem = f.mensagem.value.trim();
  const p = estado.atual;

  if (nome.length < 2) return { erro: 'Escreva seu nome para que possamos agradecer.' };

  const valor = p.tipo === 'livre' ? Number(f.valor.value) : Number(p.preco) || 0;
  if (p.tipo === 'livre' && (!valor || valor < 10)) return { erro: 'Escolha um valor a partir de R$ 10.' };

  return { nome, mensagem, valor };
}

function fluxoPix(d) {
  const p = estado.atual;
  $('#pix-titulo').textContent = p.nome;
  $('#pix-valor').textContent = brl(d.valor);

  let codigo;
  try {
    codigo = gerarPix({
      chave: CASAMENTO.pix.chave,
      nome: CASAMENTO.pix.nome,
      cidade: CASAMENTO.pix.cidade,
      valor: d.valor,
      txid: p.id.replace(/-/g, '').slice(0, 25),
    });
  } catch (e) {
    $('#erro-presente').textContent = 'Pix ainda não configurado. Tente pela loja ou fale com os noivos.';
    return;
  }

  $('#pix-codigo').value = codigo;
  desenharQR($('#pix-qr'), codigo, 210);
  passo('pix');
}

function fluxoLoja() {
  const p = estado.atual;
  $('#loja-titulo').textContent = p.nome;
  $('#loja-link').href = p.link;
  $('#loja-texto').textContent =
    'Reservamos este presente no seu nome para que ninguém repita. É só abrir a loja, '
    + 'concluir a compra e pedir a entrega no endereço dos noivos.';
  passo('loja');
}

async function registrar(metodo) {
  const p = estado.atual;
  const d = estado.dados;
  const r = await DB.reservar(p, { nome: d.nome, mensagem: d.mensagem, metodo, valor: d.valor });

  if (!r.ok && r.motivo === 'ocupado') {
    passo('dados');
    $('#erro-presente').textContent = 'Este presente acabou de ser escolhido por outra pessoa. Escolha outro ♡';
    toast('Alguém acabou de escolher este presente.');
    return false;
  }
  if (!r.ok) { toast('Não conseguimos registrar agora. Tente de novo.'); return false; }
  return true;
}

function modal() {
  const d = dlg();

  $('#trilho-presentes').addEventListener('click', (e) => {
    const b = e.target.closest('[data-presentear]');
    if (!b) return;
    const p = PRESENTES.find((x) => x.id === b.dataset.presentear);
    if (p) abrirPresente(p);
  });

  $$('[data-fechar]', d).forEach((b) => b.addEventListener('click', () => d.close()));
  d.addEventListener('click', (e) => { if (e.target === d) d.close(); });

  let metodoEscolhido = 'pix';
  $$('#form-presente button[type=submit]').forEach((b) =>
    b.addEventListener('click', () => { metodoEscolhido = b.dataset.metodo; }));

  $('#form-presente').addEventListener('submit', async (e) => {
    e.preventDefault();
    const metodo = (e.submitter && e.submitter.dataset.metodo) || metodoEscolhido;
    const dados = lerFormulario();
    if (dados.erro) { $('#erro-presente').textContent = dados.erro; return; }
    $('#erro-presente').textContent = '';
    estado.dados = dados;

    if (metodo === 'pix') {
      fluxoPix(dados);                          // reserva só depois do "Já fiz o Pix"
    } else if (await registrar('loja')) {       // loja: reserva ANTES de abrir o link
      fluxoLoja();
    }
  });

  $('#loja-pronto').addEventListener('click', () => {
    $('#fim-texto').textContent =
      'Já marcamos este presente como escolhido. Obrigado, ' + estado.dados.nome.split(' ')[0] + '!';
    passo('fim');
  });

  $('#pix-pronto').addEventListener('click', async (e) => {
    e.target.disabled = true;
    if (await registrar('pix')) {
      $('#fim-texto').textContent =
        'Assim que o valor cair na conta, confirmamos por aqui. Obrigado, ' + estado.dados.nome.split(' ')[0] + '!';
      passo('fim');
    }
    e.target.disabled = false;
  });

  $('#pix-copiar').addEventListener('click', async () => {
    const campo = $('#pix-codigo');
    try {
      await navigator.clipboard.writeText(campo.value);
    } catch (err) {
      campo.select(); document.execCommand('copy');
    }
    toast('Código Pix copiado ♡');
  });
}

/* ------------------------------------------------------------------- rsvp */
function rsvp() {
  const f = $('#form-rsvp');
  const campoAcomp = $('#campo-acompanhantes');

  $$('input[name=presenca]', f).forEach((r) =>
    r.addEventListener('change', () => { campoAcomp.hidden = f.presenca.value === 'nao'; }));

  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const erro = $('#erro-rsvp');
    const nome = f.nome.value.trim();
    const contato = f.contato.value.trim();

    if (nome.length < 3) { erro.textContent = 'Escreva seu nome completo.'; f.nome.focus(); return; }
    if (contato.length < 6) { erro.textContent = 'Deixe um WhatsApp ou e-mail para contato.'; f.contato.focus(); return; }
    erro.textContent = '';

    const btn = f.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Enviando…';

    const r = await DB.enviarRsvp({
      nome, contato,
      presenca: f.presenca.value,
      acompanhantes: f.presenca.value === 'nao' ? 0 : f.acompanhantes.value,
      mensagem: f.mensagem.value.trim(),
    });

    btn.disabled = false; btn.textContent = 'Enviar confirmação';
    if (!r.ok) { erro.textContent = 'Não conseguimos enviar agora. Tente novamente em instantes.'; return; }

    const box = $('#sucesso-rsvp');
    if (f.presenca.value === 'nao') {
      box.querySelector('.script').textContent = 'Vamos sentir sua falta.';
      box.querySelector('.texto').textContent = 'Obrigado por avisar. Você estará com a gente de outro jeito. ♡';
    }
    f.hidden = true;
    box.hidden = false;
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

/* ------------------------------------------------------------------ start */
(async function iniciar() {
  nav();
  barrasDoSistema();
  dizeres();
  contagem();
  locais();
  filtros();
  carrossel();
  modal();
  rsvp();
  revelar();
  renderPresentes();

  try {
    await DB.init();
    DB.observarPresentes((mapa) => { estado.status = mapa; renderPresentes(); });
  } catch (e) {
    console.warn('[dados] seguindo sem sincronização:', e);
  }

  if (DB.MODO === 'local') {
    console.info('%c[Mozar & Eduarda] modo local — os dados ficam só neste navegador. '
      + 'Preencha FIREBASE em js/config.js para publicar de verdade.', 'color:#8B5E3C');
  }
})();
