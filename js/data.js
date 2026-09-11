/* =============================================================
   LISTA DE PRESENTES
   tipo: 'fisico' (loja + Pix) | 'cota' (só Pix) | 'livre' (valor aberto)
   categoria: 'casa' | 'lua-de-mel' | 'experiencias' | 'livre'
   link: URL do produto na loja (Mercado Livre, Amazon...)
   img:  foto do presente em img/presentes/  (enquanto não houver, usa o placeholder)
   ============================================================= */

const PH = 'img/presentes/_placeholder.svg';

export const PRESENTES = [
  // ---------- CASA ----------
  { id: 'jogo-panelas',  nome: 'Jogo de panelas',       categoria: 'casa', tipo: 'fisico', preco: 699.00, img: PH, link: '' },
  { id: 'cafeteira',     nome: 'Cafeteira',             categoria: 'casa', tipo: 'fisico', preco: 399.00, img: PH, link: '' },
  { id: 'jogo-cama',     nome: 'Jogo de cama',          categoria: 'casa', tipo: 'fisico', preco: 350.00, img: PH, link: '' },
  { id: 'jogo-jantar',   nome: 'Aparelho de jantar',    categoria: 'casa', tipo: 'fisico', preco: 480.00, img: PH, link: '' },
  { id: 'liquidificador',nome: 'Liquidificador',        categoria: 'casa', tipo: 'fisico', preco: 260.00, img: PH, link: '' },
  { id: 'toalhas',       nome: 'Jogo de toalhas',       categoria: 'casa', tipo: 'fisico', preco: 220.00, img: PH, link: '' },

  // ---------- LUA DE MEL ----------
  { id: 'passeio-lua',   nome: 'Um passeio na lua de mel',        categoria: 'lua-de-mel', tipo: 'cota', preco: 250.00, img: PH },
  { id: 'jantar-viagem', nome: 'Um jantar especial na viagem',    categoria: 'lua-de-mel', tipo: 'cota', preco: 200.00, img: PH },
  { id: 'diaria-hotel',  nome: 'Uma diária no hotel',             categoria: 'lua-de-mel', tipo: 'cota', preco: 600.00, img: PH },
  { id: 'cafe-manha',    nome: 'Um café da manhã com vista',      categoria: 'lua-de-mel', tipo: 'cota', preco: 120.00, img: PH },

  // ---------- EXPERIÊNCIAS ----------
  { id: 'flutuacao',     nome: 'Uma flutuação em Bonito',         categoria: 'experiencias', tipo: 'cota', preco: 300.00, img: PH },
  { id: 'dia-spa',       nome: 'Um dia de spa para os dois',      categoria: 'experiencias', tipo: 'cota', preco: 450.00, img: PH },
  { id: 'brinde',        nome: 'Um brinde por nós',               categoria: 'experiencias', tipo: 'cota', preco:  80.00, img: PH },

  // ---------- PRESENTE LIVRE ----------
  { id: 'presente-livre', nome: 'Presente livre', categoria: 'livre', tipo: 'livre', multiplo: true, img: PH,
    descricao: 'Se preferir, contribua com o valor que quiser. Tudo será guardado para o começo da nossa vida juntos.' },
];

export const CATEGORIAS = [
  { id: 'todos',        label: 'Todos' },
  { id: 'casa',         label: 'Casa' },
  { id: 'lua-de-mel',   label: 'Lua de mel' },
  { id: 'experiencias', label: 'Experiências' },
  { id: 'livre',        label: 'Presente livre' },
];
