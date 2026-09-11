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
  fraseCredito: 'A mesma frase que abriu a história dos nossos pais',

  /* Dizeres em versalete que aparecem nas laterais (como na arte aprovada) */
  dizeres: {
    abertura: ['Natureza', 'Encontros', 'Histórias', 'Para sempre'],
    aquarela: ['Mesma', 'Essência', 'Novas', 'Histórias', 'Sempre juntos'],
    rodape:   ['O amor', 'também se vive', 'em lugares assim.'],
  },

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
      ['16h',   'chegada dos convidados'],
      ['16h30', 'início da cerimônia, pontualmente'],
    ],
    // Cole aqui o link do Google Maps do local (botão "Compartilhar" no Maps).
    // Se deixar vazio, o site busca pelo nome + endereço.
    mapsUrl: '',
    imagem: 'img/identidade/igreja.webp',
  },

  recepcao: {
    titulo: 'Rancho Bela Vista',
    texto:  'Após a cerimônia, seguiremos para celebrar juntos.',
    endereco: 'Bonito • MS',                       // TODO: endereço completo
    mapsUrl: '',
    imagem: 'img/identidade/recepcao.webp',
  },

  /* ---- PIX ------------------------------------------------------------
     chave: CPF (só números), e-mail, telefone (+5567...) ou chave aleatória
     nome:  como aparece no app do banco de quem paga (máx. 25 caracteres)
     cidade: máx. 15 caracteres, sem acento
     Atenção: o site é estático, então essa chave fica visível no código da
     página. Prefira e-mail ou chave aleatória — evite CPF e telefone.
     -------------------------------------------------------------------- */
  pix: {
    chave:  '',                 // TODO: chave Pix dos noivos
    nome:   'MOZAR E EDUARDA',
    cidade: 'BONITO',
  },

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
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};
