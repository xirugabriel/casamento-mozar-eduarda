/* =============================================================
   LISTA DE PRESENTES
   Todos são contribuições em dinheiro pagas pela lojinha (InfinitePay).
   O id sai do nome: renomear um presente muda o id — faça isso antes de
   alguém presentear. Para tirar um presente do site sem apagar daqui, use
   "Excluir da lista" no painel.
   img: foto em img/presentes/ (enquanto não houver, usa o placeholder)
   Este arquivo também vai para o servidor a cada deploy (preço conferido lá).
   ============================================================= */

const PH = 'img/presentes/_placeholder.svg';

const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const lista = (categoria, itens) => itens.map(([nome, preco]) =>
  ({ id: slug(nome), nome, categoria, tipo: 'cota', preco, img: PH }));

export const PRESENTES = [
  ...lista('casa', [
    ['Geladeira frost free', 3000],
    ['Lava-louças', 2900],
    ['Smart TV para a sala', 2800],
    ['Ar-condicionado do quarto', 2600],
    ['Máquina de lavar roupa', 2500],
    ['Ajuda no colchão novo', 2400],
    ['Ajuda no sofá novo', 2000],
    ['Fogão de 5 bocas', 1800],
    ['Aspirador robô', 1500],
    ['Adega climatizada', 1300],
    ['Cafeteira expresso', 900],
    ['Tapete da sala', 900],
    ['Purificador de água', 800],
    ['Micro-ondas', 700],
    ['Jogo de panelas antiaderente', 700],
    ['Aspirador vertical', 650],
    ['Batedeira planetária', 600],
    ['Cortinas da sala', 600],
    ['Caixa de som para a casa', 600],
    ['Aparelho de jantar completo', 550],
    ['Panela de pressão elétrica', 500],
    ['Air fryer', 450],
    ['Processador de alimentos', 450],
    ['Jogo de cama queen', 450],
    ['Faqueiro inox', 400],
    ['Roupões do casal', 400],
    ['Edredom para o inverno', 380],
    ['Jogo de facas do chef', 350],
    ['Luminária de chão', 350],
    ['Travesseiros de pluma (o par)', 320],
    ['Taças de cristal', 300],
    ['Kit de ferramentas da casa', 300],
    ['Mesa posta completa', 280],
    ['Liquidificador', 250],
    ['Jogo de toalhas de banho', 250],
    ['Ferro a vapor', 220],
    ['Sanduicheira e grill', 200],
    ['Potes herméticos para a despensa', 180],
    ['Chaleira elétrica', 180],
    ['Torradeira', 160],
  ]),

  ...lista('lua-de-mel', [
    ['Passagens da lua de mel', 3000],
    ['Passeio de helicóptero', 2500],
    ['Voo de balão ao amanhecer', 1800],
    ['Upgrade para o quarto com vista', 1200],
    ['Ensaio fotográfico na viagem', 1000],
    ['Noite em cabana na montanha', 900],
    ['Uma diária no hotel', 800],
    ['Mergulho com cilindro', 700],
    ['Day use em resort', 700],
    ['Mala de viagem nova', 650],
    ['Passeio de barco', 600],
    ['Ingressos para um show na viagem', 600],
    ['Tour por uma vinícola', 550],
    ['Massagem para dois', 500],
    ['Jantar romântico à beira-mar', 450],
    ['Seguro viagem', 400],
    ['Aula de culinária local', 350],
    ['Aluguel de carro por um dia', 300],
    ['Piquenique ao pôr do sol', 250],
    ['Transfer do aeroporto', 200],
    ['Drinks na beira da piscina', 180],
    ['Café da manhã na cama', 150],
    ['Lembrancinhas da viagem', 150],
    ['Passeio de bicicleta', 120],
    ['Sorvete todos os dias da viagem', 100],
  ]),

  ...lista('experiencias', [
    ['Abismo Anhumas em Bonito', 1600],
    ['Fim de semana em uma pousada', 1500],
    ['Curso de dança a dois', 800],
    ['Show da nossa banda favorita', 700],
    ['Churrasco para os amigos', 700],
    ['Spa day para os dois', 600],
    ['Jantar de um ano de casados', 600],
    ['Cinema com pipoca (10 sessões)', 500],
    ['Streaming por um ano', 450],
    ['Flutuação no Rio da Prata', 400],
    ['Jantar no nosso restaurante preferido', 400],
    ['Degustação de vinhos', 400],
    ['Cachoeiras da Estância Mimosa', 350],
    ['Garrafa de vinho especial', 300],
    ['Passeio a cavalo', 300],
    ['Boia-cross no Rio Formoso', 250],
    ['Rodízio de sushi a dois', 250],
    ['Noite de fondue', 220],
    ['Gruta do Lago Azul', 200],
    ['Brunch de domingo', 180],
  ]),

  ...lista('divertidos', [
    ['Fundo para a primeira reforma', 3000],
    ['Viagem de um ano de casados', 2000],
    ['Primeiro mercado da casa nova', 800],
    ['Ração e petiscos das cachorras (3 meses)', 600],
    ['Ajuda para o primeiro boleto', 500],
    ['Café das segundas-feiras por um ano', 500],
    ['Pizza de domingo por um mês', 400],
    ['Conserto do primeiro cano que vazar', 350],
    ['Conta de luz do ar-condicionado', 300],
    ['Aulas de culinária para o noivo', 300],
    ['Fundo da geladeira vazia', 250],
    ['Plantas para a casa nova', 220],
    ['Banho e tosa das cachorras', 200],
    ['Kit sobrevivência da primeira briga', 150],
    ['A noiva escolhe o filme da semana', 100],
  ]),

  // ---------- PRESENTE LIVRE ----------
  { id: 'presente-livre', nome: 'Presente livre', categoria: 'livre', tipo: 'livre', multiplo: true, img: PH,
    descricao: 'Se preferir, contribua com o valor que quiser. Tudo será guardado para o começo da nossa vida juntos.' },
];

export const CATEGORIAS = [
  { id: 'todos',        label: 'Todos' },
  { id: 'casa',         label: 'Casa' },
  { id: 'lua-de-mel',   label: 'Lua de mel' },
  { id: 'experiencias', label: 'Experiências' },
  { id: 'divertidos',   label: 'Divertidos' },
  { id: 'livre',        label: 'Presente livre' },
];
