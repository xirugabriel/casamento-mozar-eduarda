/* =============================================================
   Painel dos noivos — RSVPs, presentes e status da lista.
   ============================================================= */
import { PRESENTES } from './data.js?v=presentes-fotos-1';
import * as DB from './db.js?v=202611251641';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

const brl = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const data = (iso) => iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

let toastT;
function toast(m) {
  const el = $('#toast'); el.textContent = m; el.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 3000);
}

const estado = { registros: [], rsvps: [], status: {} };

/* ------------------------------------------------------------------ login */
async function login() {
  await DB.init(true);
  const local = DB.MODO === 'local';
  $('#aviso-local').hidden = !local;
  $('#campo-email').hidden = local;
  $('#campo-senha').hidden = local;

  $('#form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    const r = await DB.entrar(f.email ? f.email.value.trim() : '', f.senha ? f.senha.value : '');
    if (!r.ok) {
      $('#erro-login').textContent = r.motivo === 'auth/invalid-credential'
        ? 'E-mail ou senha incorretos.' : 'Não foi possível entrar. Verifique os dados.';
      return;
    }
    $('#erro-login').textContent = '';
    if (local) mostrarPainel();
  });

  DB.observarAuth((usuario) => {
    $('#tela-sessao').hidden = true;
    if (usuario) {
      mostrarPainel();
    } else {
      $('#tela-painel').hidden = true;
      $('#form-login').reset();
      $('#tela-login').hidden = false;
    }
  });
  $('#sair').addEventListener('click', () => DB.sair());
}

function mostrarPainel() {
  $('#tela-login').hidden = true;
  $('#tela-painel').hidden = false;
  carregar();
}

/* ------------------------------------------------------------------ dados */
async function carregar() {
  const botao = $('#recarregar');
  if (botao.disabled) return;
  botao.disabled = true;
  botao.textContent = 'Atualizando…';
  const aviso = $('#erro-atualizar');
  aviso.hidden = true;
  const [registros, rsvps] = await Promise.allSettled([
    DB.listarRegistros(),
    DB.listarRsvps(),
  ]);
  if (registros.status === 'fulfilled') estado.registros = registros.value;
  if (rsvps.status === 'fulfilled') estado.rsvps = marcarSubstituidas(rsvps.value);
  const falhas = [registros.status === 'rejected' && 'presentes', rsvps.status === 'rejected' && 'presenças'].filter(Boolean);
  if (falhas.length) {
    aviso.textContent = 'Não foi possível atualizar ' + falhas.join(' e ') + '. Toque em Atualizar para tentar novamente.';
    aviso.hidden = false;
  }
  botao.disabled = false;
  botao.textContent = 'Atualizar';
  render();
}

/* Mesmo contato = mesma pessoa: vale a resposta mais recente. As anteriores
   continuam no banco (histórico), mas saem da tabela, das contas e do CSV.
   A lista chega da mais nova para a mais antiga. */
export function chaveContato(c) {
  const s = String(c || '').trim().toLowerCase();
  if (s.includes('@')) return s;
  // celular sem DDD e sem +55: "992737789", "(69) 99273-7789" e "+55 69…" são a mesma pessoa.
  // shortcut: mesmo número em DDDs diferentes vira uma pessoa só; numa lista de casamento, aceitável
  return s.replace(/\D/g, '').slice(-9);
}

function marcarSubstituidas(lista) {
  const vistos = new Set();
  return lista.map((r) => {
    const k = chaveContato(r.contato);
    const substituida = !!k && vistos.has(k);
    vistos.add(k);
    return Object.assign({}, r, { substituida });
  });
}
const validas = () => estado.rsvps.filter((r) => !r.substituida);

function render() {
  kpis();
  tabelaPresentes();
  tabelaRsvps();
  tabelaLista();
}

/* -------------------------------------------------------------------- kpi */
function kpis() {
  const sim = validas().filter((r) => r.presenca !== 'nao');
  const pessoas = sim.reduce((t, r) => t + 1 + (Number(r.acompanhantes) || 0), 0);
  const escolhidos = Object.values(estado.status).filter(DB.ocupado).length;
  const soma = (l) => l.reduce((t, r) => t + (Number(r.valor) || 0), 0);
  const pixTotal = soma(estado.registros.filter((r) => r.metodo === 'pix' && r.status === 'recebido'));
  const pixConfirmado = soma(estado.registros.filter((r) => r.status === 'recebido'));

  $('#kpis').innerHTML = [
    ['Confirmações', sim.length],
    ['Pessoas esperadas', pessoas],
    ['Não poderão ir', validas().length - sim.length],
    ['Presentes escolhidos', escolhidos + ' / ' + PRESENTES.filter((p) => !p.multiplo && !oculto(p)).length],
    ['Recebido no Pix', brl(pixTotal)],
    ['Recebido no total', brl(pixConfirmado)],
  ].map(([rot, v]) => `<div class="kpi"><b>${esc(v)}</b><span>${esc(rot)}</span></div>`).join('');
}

/* No celular cada linha vira um cartão: cada célula leva o nome da sua coluna
   (o CSS do admin.html mostra como rótulo). Coluna sem título (ações) fica sem. */
function rotular(tabela) {
  const cab = $$('thead th', tabela).map((th) => th.textContent.trim());
  $$('thead, tbody', tabela).forEach((grupo) => grupo.setAttribute('role', 'rowgroup'));
  $$('tr', tabela).forEach((linha) => linha.setAttribute('role', 'row'));
  $$('tbody tr', tabela).forEach((tr) => [...tr.children].forEach((td, i) => {
    td.setAttribute('role', 'cell');
    if (cab[i]) td.dataset.rotulo = cab[i];
  }));
}

/* -------------------------------------------------------- tabela presentes */
const como = (r) => ({ pix: 'Pix', cartao: 'Cartão' })[r.metodo] || 'Loja';

const marcaStatus = (r) => r.status === 'recebido'
  ? '<span class="tag tag--ok">Confirmado</span>'
  : (r.metodo === 'pix'
    ? '<span class="tag tag--espera">Pix a conferir</span>'
    : '<span class="tag tag--espera">Compra a conferir</span>');

/* WhatsApp para agradecer: o número que a pessoa deixou no presente ou, se não
   deixou, o celular da confirmação de presença com o mesmo nome. Só celulares do
   Brasil com DDD; sem número válido, sem botão. */
export function linkZap(numero, texto) {
  let d = String(numero || '').replace(/\D/g, '');
  if (d.length === 10 || d.length === 11) d = '55' + d;
  if (!(d.length >= 12 && d.length <= 13 && d.startsWith('55'))) return '';
  return 'https://wa.me/' + d + '?text=' + encodeURIComponent(texto);
}
const mesmoNome = (a, b) => [a, b].map((s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' '))
  .reduce((x, y) => x === y);

function zapAgradecer(r) {
  const rsvp = estado.rsvps.find((x) => mesmoNome(x.nome, r.nome) && linkZap(x.contato, '-'));
  const numero = linkZap(r.whatsapp, '-') ? r.whatsapp : rsvp && rsvp.contato;
  const nome = String(r.nome || '').trim().split(/\s+/)[0];
  return linkZap(numero, `Oi, ${nome}! Recebemos o seu presente (${r.presenteNome}) e ficamos muito felizes. `
    + 'Obrigado pelo carinho! ♡ Mozar & Eduarda');
}

function tabelaPresentes() {
  const busca = ($('#busca-presentes').value || '').toLowerCase();
  const linhas = estado.registros.filter((r) =>
    !busca || (r.nome + ' ' + r.presenteNome).toLowerCase().includes(busca));

  $('#tab-presentes').innerHTML = linhas.length ? `
    <thead><tr>
      <th>Quando</th><th>Presente</th><th>Quem presenteou</th><th>Mensagem</th>
      <th>Como</th><th>Valor</th><th>Situação</th><th></th>
    </tr></thead>
    <tbody>${linhas.map((r) => { const zap = zapAgradecer(r); return `
      <tr>
        <td>${esc(data(r.em))}</td>
        <td class="nome">${esc(r.presenteNome)}</td>
        <td class="nome">${esc(r.nome)}</td>
        <td class="msg">${esc(r.mensagem) || '—'}</td>
        <td>${esc(como(r))}</td>
        <td>${esc(brl(r.valor))}</td>
        <td>${marcaStatus(r)}</td>
        <td><div class="acoes">
          ${zap ? `<a class="mini mini--forte" href="${esc(zap)}" target="_blank" rel="noopener">WhatsApp</a>` : ''}
          ${r.status === 'recebido' ? '' :
            `<button class="mini mini--forte" data-confirmar="${esc(r.id)}">Confirmar</button>`}
          <button class="mini" data-excluir-registro="${esc(r.id)}">Excluir</button>
        </div></td>
      </tr>`; }).join('')}</tbody>`
    : `<tbody><tr><td class="vazio">${busca ? 'Nenhum presente encontrado.' : 'Nenhum presente registrado ainda.'}</td></tr></tbody>`;
  rotular($('#tab-presentes'));
}

/* ------------------------------------------------------------ tabela rsvps */
function tabelaRsvps() {
  const busca = ($('#busca-rsvps').value || '').toLowerCase();
  const linhas = validas().filter((r) => !busca || (r.nome + ' ' + r.contato).toLowerCase().includes(busca));

  $('#tab-rsvps').innerHTML = linhas.length ? `
    <thead><tr>
      <th>Quando</th><th>Convidado</th><th>Contato</th><th>Vai?</th>
      <th>Acompanhantes</th><th>Mensagem</th><th></th>
    </tr></thead>
    <tbody>${linhas.map((r) => `
      <tr>
        <td>${esc(data(r.em))}</td>
        <td class="nome">${esc(r.nome)}</td>
        <td>${esc(r.contato)}</td>
        <td>${r.presenca === 'nao' ? '<span class="tag tag--nao">Não vai</span>'
          : '<span class="tag tag--ok">Confirmado</span>'}</td>
        <td>${esc(r.acompanhantes || 0)}</td>
        <td class="msg">${esc(r.mensagem) || '—'}</td>
        <td><div class="acoes"><button class="mini" data-excluir-rsvp="${esc(r.id)}">Excluir</button></div></td>
      </tr>`).join('')}</tbody>`
    : `<tbody><tr><td class="vazio">${busca ? 'Nenhum convidado encontrado.' : 'Nenhuma confirmação recebida ainda.'}</td></tr></tbody>`;
  rotular($('#tab-rsvps'));
}

/* ------------------------------------------------------------ tabela lista */
/* "Excluir da lista" não apaga o presente de js/data.js: marca como oculto no banco,
   o site deixa de mostrar e o servidor recusa pagamento. "Restaurar" desfaz. */
const oculto = (p) => !!(estado.status[p.id] && estado.status[p.id].status === 'oculto');

function tabelaLista() {
  const busca = ($('#busca-lista').value || '').toLowerCase();
  const linhas = PRESENTES.filter((p) => !p.multiplo && (!busca || p.nome.toLowerCase().includes(busca))).map((p) => {
    const st = estado.status[p.id];
    const s = oculto(p) ? 'oculto'
      : DB.ocupado(st) ? st.status : 'disponivel';   // reserva vencida conta como disponível
    const quem = estado.registros.filter((r) => r.presenteId === p.id).map((r) => r.nome).join(', ');
    return { p, s, quem };
  }).sort((a, b) => Number(a.s === 'oculto') - Number(b.s === 'oculto'));   // excluídos no fim

  $('#tab-lista').innerHTML = linhas.length ? `
    <thead><tr><th>Presente</th><th>Valor</th><th>Situação</th><th>Quem escolheu</th><th></th></tr></thead>
    <tbody>${linhas.map(({ p, s, quem }) => `
      <tr>
        <td class="nome">${esc(p.nome)}</td>
        <td>${esc(brl(p.preco))}</td>
        <td>${s === 'oculto' ? '<span class="tag tag--nao">Excluído do site</span>'
          : s === 'disponivel' ? '<span class="tag tag--espera">Disponível</span>'
          : s === 'recebido' ? '<span class="tag tag--ok">Recebido</span>'
          : '<span class="tag tag--espera">Aguardando pagamento</span>'}</td>
        <td>${esc(quem) || '—'}</td>
        <td><div class="acoes">${s === 'oculto'
          ? `<button class="mini" data-liberar="${esc(p.id)}">Restaurar</button>`
          : `${s === 'disponivel' ? `<button class="mini" data-ocultar="${esc(p.id)}">Excluir da lista</button>`
              : `<button class="mini" data-liberar="${esc(p.id)}">Liberar</button>`}
          ${s === 'recebido' ? '' : `<button class="mini mini--forte" data-recebido="${esc(p.id)}">Marcar recebido</button>`}`}
        </div></td>
      </tr>`).join('')}</tbody>`
    : '<tbody><tr><td class="vazio">Nenhum presente encontrado.</td></tr></tbody>';
  rotular($('#tab-lista'));
}

/* ------------------------------------------------------------------- csv */
function csv(qual) {
  let cab, linhas, nome;
  if (qual === 'rsvps') {
    nome = 'confirmacoes';
    cab = ['Quando', 'Convidado', 'Contato', 'Vai', 'Acompanhantes', 'Mensagem'];
    linhas = validas().map((r) => [data(r.em), r.nome, r.contato,
      r.presenca === 'nao' ? 'Não' : 'Sim', r.acompanhantes || 0, r.mensagem]);
  } else {
    nome = 'presentes';
    cab = ['Quando', 'Presente', 'Quem presenteou', 'Mensagem', 'Como', 'Valor', 'Situação'];
    linhas = estado.registros.map((r) => [data(r.em), r.presenteNome, r.nome, r.mensagem,
      como(r), String(r.valor || 0).replace('.', ','),
      r.status === 'recebido' ? 'Confirmado' : 'A conferir']);
  }
  const campo = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  const texto = '﻿' + [cab, ...linhas].map((l) => l.map(campo).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([texto], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${nome}-mozar-eduarda.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---------------------------------------------------------------- eventos */
function eventos() {
  const abas = $$('.aba');
  const barraAbas = $('.abas');
  function selecionar(aba) {
    abas.forEach((botao) => {
      const ativo = botao === aba;
      botao.setAttribute('aria-selected', String(ativo));
      botao.tabIndex = ativo ? 0 : -1;
      document.getElementById(botao.getAttribute('aria-controls')).hidden = !ativo;
    });
    const painel = document.getElementById(aba.getAttribute('aria-controls'));
    if (painel.getBoundingClientRect().top < barraAbas.getBoundingClientRect().bottom) {
      painel.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }
  abas.forEach((aba) => aba.addEventListener('click', () => selecionar(aba)));
  barraAbas.addEventListener('keydown', (e) => {
    const atual = abas.indexOf(e.target);
    const destinos = {
      ArrowLeft: (atual + abas.length - 1) % abas.length,
      ArrowRight: (atual + 1) % abas.length,
      Home: 0,
      End: abas.length - 1,
    };
    const destino = destinos[e.key];
    if (atual < 0 || !Number.isInteger(destino)) return;
    e.preventDefault();
    abas[destino].focus({ preventScroll: true });
    selecionar(abas[destino]);
  });

  $('#busca-presentes').addEventListener('input', tabelaPresentes);
  $('#busca-rsvps').addEventListener('input', tabelaRsvps);
  $('#busca-lista').addEventListener('input', tabelaLista);
  $('#recarregar').addEventListener('click', carregar);
  $$('[data-csv]').forEach((b) => b.addEventListener('click', () => csv(b.dataset.csv)));

  document.addEventListener('click', async (e) => {
    const b = e.target.closest('button[data-confirmar], button[data-excluir-registro], button[data-excluir-rsvp], button[data-liberar], button[data-recebido], button[data-ocultar]');
    if (!b) return;
    if (b.disabled) return;
    b.disabled = true;
    const d = b.dataset;
    try {
      if (d.confirmar) {
        await DB.atualizarRegistro(d.confirmar, { status: 'recebido' });
        const r = estado.registros.find((x) => x.id === d.confirmar);
        if (r) { r.status = 'recebido'; await DB.definirStatus(r.presenteId, 'recebido'); }
        toast('Presente confirmado ♡');
      }
      else if (d.excluirRegistro) {
        if (!confirm('Excluir este registro? O presente continua com o status atual.')) return;
        await DB.excluir('registros', d.excluirRegistro);
        estado.registros = estado.registros.filter((x) => x.id !== d.excluirRegistro);
        toast('Registro excluído.');
      }
      else if (d.excluirRsvp) {
        if (!confirm('Excluir esta confirmação de presença?')) return;
        await DB.excluir('rsvps', d.excluirRsvp);
        estado.rsvps = marcarSubstituidas(estado.rsvps.filter((x) => x.id !== d.excluirRsvp));
        toast('Confirmação excluída.');
      }
      else if (d.liberar) {
        if (!confirm('Devolver este presente para a lista? Ele volta a aparecer para os convidados.')) return;
        await DB.definirStatus(d.liberar, 'disponivel');
        toast('Presente liberado.');
      }
      else if (d.recebido) {
        await DB.definirStatus(d.recebido, 'recebido');
        toast('Marcado como recebido ♡');
      }
      else if (d.ocultar) {
        await DB.definirStatus(d.ocultar, 'oculto');
        toast('Presente excluído do site. Dá para restaurar no fim da lista.');
      }
      render();
    } catch (erro) {
      console.error('Falha ao salvar a alteração:', erro);
      toast('Não foi possível salvar a alteração. Atualize o painel e tente novamente.');
    } finally {
      b.disabled = false;
    }
  });
}

/* ------------------------------------------------------------------ start */
(async function iniciar() {
  eventos();
  try {
    await login();
  } catch (erro) {
    console.error('Falha ao iniciar a sessão do painel:', erro);
    $('#mensagem-sessao').textContent = 'Não foi possível verificar sua sessão.';
    $('#tentar-sessao').hidden = false;
    return;
  }
  DB.observarPresentes((mapa) => { estado.status = mapa; if (!$('#tela-painel').hidden) render(); });
})();
