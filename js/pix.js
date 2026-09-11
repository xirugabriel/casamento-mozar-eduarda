/* =============================================================
   Pix "Copia e Cola" — BR Code estático (padrão EMV/BACEN)
   Gerado 100% no navegador: sem gateway, sem taxa, sem servidor.
   ============================================================= */

const tlv = (id, valor) => id + String(valor.length).padStart(2, '0') + valor;

const limpar = (s, max) =>
  (s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // tira acentos
    .replace(/[^A-Za-z0-9 .\-]/g, '')
    .replace(/\s+/g, ' ').trim().toUpperCase()
    .slice(0, max);

/** CRC16/CCITT-FALSE — poly 0x1021, init 0xFFFF */
function crc16(str) {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * @param {object} o
 * @param {string} o.chave   chave Pix do recebedor
 * @param {string} o.nome    nome do recebedor (máx. 25)
 * @param {string} o.cidade  cidade do recebedor (máx. 15)
 * @param {number} [o.valor] valor em reais; omitido = valor livre no app
 * @param {string} [o.txid]  identificador (alfanumérico, máx. 25)
 * @returns {string} payload para copiar e colar / virar QR Code
 */
export function gerarPix({ chave, nome, cidade, valor, txid }) {
  if (!chave) throw new Error('Chave Pix não configurada em js/config.js');

  let conta = tlv('00', 'br.gov.bcb.pix') + tlv('01', String(chave).trim());
  const id = limpar(txid, 25).replace(/[^A-Z0-9]/g, '') || '***';

  const campos = [
    tlv('00', '01'),                                  // payload format
    tlv('26', conta),                                 // conta do recebedor
    tlv('52', '0000'),                                // merchant category
    tlv('53', '986'),                                 // BRL
    valor > 0 ? tlv('54', Number(valor).toFixed(2)) : '',
    tlv('58', 'BR'),
    tlv('59', limpar(nome, 25) || 'RECEBEDOR'),
    tlv('60', limpar(cidade, 15) || 'BRASIL'),
    tlv('62', tlv('05', id)),                         // txid
  ].join('');

  const parcial = campos + '6304';
  return parcial + crc16(parcial);
}

/** Desenha o QR Code dentro de `el`. Usa a lib qrcodejs carregada no HTML. */
export function desenharQR(el, texto, tamanho = 220) {
  el.innerHTML = '';
  if (typeof QRCode === 'undefined') {
    el.innerHTML = '<p class="qr-erro">Não foi possível gerar o QR Code. Use o código copia e cola abaixo.</p>';
    return false;
  }
  /* global QRCode */
  new QRCode(el, {
    text: texto,
    width: tamanho,
    height: tamanho,
    colorDark: '#1F3B2E',
    colorLight: '#FFFFFF',
    correctLevel: QRCode.CorrectLevel.M,
  });
  return true;
}
