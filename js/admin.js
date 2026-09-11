/* =============================================================
   Painel dos noivos — RSVPs, presentes e status da lista.
   ============================================================= */
import { PRESENTES } from './data.js?v=202609111958';
import * as DB from './db.js?v=202609111958';

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
  await DB.init();
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

  DB.observarAuth((u) => { if (u) mostrarPainel(); });
  $('#sair').addEventListener('click', () => DB.sair());
}

function mostrarPainel() {
  $('#tela-login').hidden = true;
  $('#tela-painel').hidden = false;
  carregar();
}

/* ------------------------------------------------------------------ dados */
async function carregar() {
  const [registros, rsvps] = await Promise.all([
    DB.listarRegistros().catch(() => []),
    DB.listarRsvps().catch(() => []),
  ]);
  estado.registros = registros;
  estado.rsvps = rsvps;
  render();
}

function render() {
  kpis();
  tabelaPresentes();
  tabelaRsvps();
  tabelaLista();
}

/* -------------------------------------------------------------------- kpi */
function kpis() {
  const sim = estado.rsvps.filter((r) => r.presenca !== 'nao');
  const pessoas = sim.reduce((t, r) => t + 1 + (Number(r.acompanhantes) || 0), 0);
  const escolhidos = Object.values(estado.status).filter((s) => s.status && s.status !== 'disponivel').length;
  const pix = estado.registros.filter((r) => r.metodo === 'pix');
  const pixTotal = pix.reduce((t, r) => t + (Number(r.valor) || 0), 0);
  const pixConfirmado = pix.filter((r) => r.status === 'recebido').reduce((t, r) => t + (Number(r.valor) || 0), 0);

  $('#kpis').innerHTML = [
    ['Confirmações', sim.length],
    ['Pessoas esperadas', pessoas],
    ['Não poderão ir', estado.rsvps.length - sim.length],
    ['Presentes escolhidos', escolhidos + ' / ' + PRESENTES.filter((p) => !p.multiplo).length],
    ['Pix anunciado', brl(pixTotal)],
    ['Pix confirmado', brl(pixConfirmado)],
  ].map(([rot, v]) => `<div class="kpi"><b>${esc(v)}</b><span>${esc(rot)}</span></div>`).join('');
}

/* -------------------------------------------------------- tabela presentes */
const marcaStatus = (r) => r.status === 'recebido'
  ? '<span class="tag tag--ok">Confirmado</span>'
  : (r.metodo === 'pix'
    ? '<span class="tag tag--espera">Pix a conferir</span>'
    : '<span class="tag tag--espera">Compra a conferir</span>');

function tabelaPresentes() {
  const busca = ($('#busca-presentes').value || '').toLowerCase();
  const linhas = estado.registros.filter((r) =>
    !busca || (r.nome + ' ' + r.presenteNome).toLowerCase().includes(busca));

  $('#tab-presentes').innerHTML = linhas.length ? `
    <thead><tr>
      <th>Quando</th><th>Presente</th><th>Quem presenteou</th><th>Mensagem</th>
      <th>Como</th><th>Valor</th><th>Situação</th><th></th>
    </tr></thead>
    <tbody>${linhas.map((r) => `
      <tr>
        <td>${esc(data(r.em))}</td>
        <td class="nome">${esc(r.presenteNome)}</td>
        <td class="nome">${esc(r.nome)}</td>
        <td class="msg">${esc(r.mensagem) || '—'}</td>
        <td>${r.metodo === 'pix' ? 'Pix' : 'Loja'}</td>
        <td>${esc(brl(r.valor))}</td>
        <td>${marcaStatus(r)}</td>
        <td><div class="acoes">
          ${r.status === 'recebido' ? '' :
            `<button class="mini mini--forte" data-confirmar="${esc(r.id)}">Confirmar</button>`}
          <button class="mini" data-excluir-registro="${esc(r.id)}">Excluir</button>
        </div></td>
      </tr>`).join('')}</tbody>`
    : '<tbody><tr><td class="vazio">Nenhum presente registrado ainda.</td></tr></tbody>';
}

/* ------------------------------------------------------------ tabela rsvps */
function tabelaRsvps() {
  const busca = ($('#busca-rsvps').value || '').toLowerCase();
  const linhas = estado.rsvps.filter((r) => !busca || (r.nome + ' ' + r.contato).toLowerCase().includes(busca));

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
        <td>${r.presenca === 'nao'
          ? '<span class="tag tag--nao">Não vai</span>'
          : '<span class="tag tag--ok">Confirmado</span>'}</td>
        <td>${esc(r.acompanhantes || 0)}</td>
        <td class="msg">${esc(r.mensagem) || '—'}</td>
        <td><button class="mini" data-excluir-rsvp="${esc(r.id)}">Excluir</button></td>
      </tr>`).join('')}</tbody>`
    : '<tbody><tr><td class="vazio">Nenhuma confirmação recebida ainda.</td></tr></tbody>';
}

/* ------------------------------------------------------------ tabela lista */
function tabelaLista() {
  const linhas = PRESENTES.filter((p) => !p.multiplo).map((p) => {
    const s = (estado.status[p.id] && estado.status[p.id].status) || 'disponivel';
    const quem = estado.registros.filter((r) => r.presenteId === p.id).map((r) => r.nome).join(', ');
    return { p, s, quem };
  });

  $('#tab-lista').innerHTML = `
    <thead><tr><th>Presente</th><th>Valor</th><th>Situação</th><th>Quem escolheu</th><th></th></tr></thead>
    <tbody>${linhas.map(({ p, s, quem }) => `
      <tr>
        <td class="nome">${esc(p.nome)}</td>
        <td>${esc(brl(p.preco))}</td>
        <td>${s === 'disponivel' ? '<span class="tag tag--espera">Disponível</span>'
          : s === 'recebido' ? '<span class="tag tag--ok">Recebido</span>'
          : '<span class="tag tag--espera">Escolhido</span>'}</td>
        <td>${esc(quem) || '—'}</td>
        <td><div class="acoes">
          ${s === 'disponivel' ? '' : `<button class="mini" data-liberar="${esc(p.id)}">Liberar</button>`}
          ${s === 'recebido' ? '' : `<button class="mini mini--forte" data-recebido="${esc(p.id)}">Marcar recebido</button>`}
        </div></td>
      </tr>`).join('')}</tbody>`;
}

/* ------------------------------------------------------------------- csv */
function csv(qual) {
  let cab, linhas, nome;
  if (qual === 'rsvps') {
    nome = 'confirmacoes';
    cab = ['Quando', 'Convidado', 'Contato', 'Vai', 'Acompanhantes', 'Mensagem'];
    linhas = estado.rsvps.map((r) => [data(r.em), r.nome, r.contato,
      r.presenca === 'nao' ? 'Não' : 'Sim', r.acompanhantes || 0, r.mensagem]);
  } else {
    nome = 'presentes';
    cab = ['Quando', 'Presente', 'Quem presenteou', 'Mensagem', 'Como', 'Valor', 'Situação'];
    linhas = estado.registros.map((r) => [data(r.em), r.presenteNome, r.nome, r.mensagem,
      r.metodo === 'pix' ? 'Pix' : 'Loja', String(r.valor || 0).replace('.', ','),
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
  $$('.aba').forEach((b) => b.addEventListener('click', () => {
    $$('.aba').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    ['presentes', 'rsvps', 'lista'].forEach((n) => { $('#painel-' + n).hidden = n !== b.dataset.aba; });
  }));

  $('#busca-presentes').addEventListener('input', tabelaPresentes);
  $('#busca-rsvps').addEventListener('input', tabelaRsvps);
  $('#recarregar').addEventListener('click', carregar);
  $$('[data-csv]').forEach((b) => b.addEventListener('click', () => csv(b.dataset.csv)));

  document.addEventListener('click', async (e) => {
    const b = e.target.closest('button[data-confirmar], button[data-excluir-registro], button[data-excluir-rsvp], button[data-liberar], button[data-recebido]');
    if (!b) return;
    const d = b.dataset;

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
      estado.rsvps = estado.rsvps.filter((x) => x.id !== d.excluirRsvp);
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
    render();
  });
}

/* ------------------------------------------------------------------ start */
(async function iniciar() {
  eventos();
  await login();
  DB.observarPresentes((mapa) => { estado.status = mapa; if (!$('#tela-painel').hidden) render(); });
})();
