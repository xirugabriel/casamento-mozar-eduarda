/* =============================================================
   CONFIGURAÇÃO DO SITE — MOZAR & EDUARDA
   Este é o único arquivo que precisa ser editado no dia a dia.
   ============================================================= */

export const CASAMENTO = {
  noivos:     'Mozar & Eduarda',
  dataISO:    '2027-10-02',            // data do casamento (AAAA-MM-DD)
  horaISO:    '16:30',
  fuso:       'America/Campo_Grande',  // Bonito/MS
  dataLabel:  '02 • 10 • 2027',
  cidade:     'Bonito • MS',

  // A frase do casamento dos pais do Mozar. Duas linhas.
  frase: ['Que esse seja o nosso destino...', 'amar, viver e começar cada dia junto.'],

  /* Dizeres em versalete que aparecem nas laterais (como na arte aprovada) */
  dizeres: {
    abertura: ['Deus', 'Amor', 'Família', 'Para sempre'],
    aquarela: ['Nossa história, nossos sonhos', 'O começo do nosso para sempre'],
  },

  /* frase de fechamento do rodapé */
  fraseFinal: 'Que seja inesquecível, não apenas para nós, mas para todos que fazem parte da nossa história.',

  /* 'dias'  -> só o número de dias (como pedido no briefing)
     'completa' -> dias | horas | minutos | segundos (como no mockup) */
  contagem: 'completa',
  contagemSub: 'para o nosso grande dia',

  /* 'carrossel' -> presentes deslizando com setas (como no mockup)
     'grade'     -> todos visíveis de uma vez */
  layoutPresentes: 'carrossel',

  cerimonia: {
    titulo: 'Matriz Paróquia São Pedro Apóstolo',
    endereco: 'Bonito • MS',                       // TODO: endereço completo
    horarios: [
      ['16h',   'chegada'],
      ['16h30', 'cerimônia', 'pontualmente'],   // 3º item opcional: nota em destaque
    ],
    // Cole aqui o link do Google Maps do local (botão "Compartilhar" no Maps).
    // Se deixar vazio, o site busca pelo nome + endereço.
    mapsUrl: '',
    imagem: 'img/identidade/cerimonia-aquarela.webp',
  },

  recepcao: {
    titulo: 'Rancho Bela Vista',
    texto:  'Após a cerimônia, seguiremos para celebrar juntos.',
    endereco: 'Bonito • MS',                       // TODO: endereço completo
    mapsUrl: '',
    imagem: 'img/identidade/recepcao-aquarela.webp',
  },

  /* ---- LOJINHA ---------------------------------------------------------
     Endereço das funções de pagamento (InfinitePay) no Firebase. Vazio = o
     botão "Presentear" avisa que a lista ainda está sendo preparada.
     -------------------------------------------------------------------- */
  checkout: '',   // depois do deploy: 'https://southamerica-east1-casamento-76063.cloudfunctions.net'

  contato: {
    whatsapp: '',               // TODO: ex. '5567999999999' (para dúvidas no rodapé)
  },
};

/* ---- FIREBASE --------------------------------------------------------
   Enquanto estiver vazio, o site roda em MODO LOCAL: tudo funciona, mas os
   dados ficam só no navegador de quem está testando. Depois de criar o
   projeto no Firebase, cole aqui o objeto de configuração e o site passa a
   gravar de verdade, em tempo real, para todos os convidados.
   Passo a passo: veja README.md
   --------------------------------------------------------------------- */
export const FIREBASE = {
  apiKey: 'AIzaSyBhSOrYCsXXNQuP7XYeLZJ0g-2pvHNXK_8',
  authDomain: 'casamento-76063.firebaseapp.com',
  projectId: 'casamento-76063',
  storageBucket: 'casamento-76063.firebasestorage.app',
  messagingSenderId: '230034678847',
  appId: '1:230034678847:web:3a52de6bcc7f167513c48a',
};
