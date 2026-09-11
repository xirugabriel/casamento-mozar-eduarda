# Site do casamento — Mozar & Eduarda

Site estático (HTML, CSS e JavaScript puros — sem build, sem framework) com dados no
**Cloud Firestore**. Abre o envelope verde, mostra a aquarela, conta os dias, leva aos
mapas, recebe presentes por Pix ou loja e confirma presenças.

```
site/
├── index.html          página do casamento
├── admin.html          painel dos noivos (/admin.html)
├── firestore.rules     regras de segurança do banco
├── css/style.css       identidade visual inteira (paleta, tipografia, componentes)
├── js/
│   ├── config.js       ← ÚNICO arquivo do dia a dia: datas, locais, chave Pix, Firebase
│   ├── data.js         ← lista de presentes
│   ├── pix.js          gerador do QR Code Pix (padrão BACEN, feito no navegador)
│   ├── db.js           camada de dados (Firestore, com modo local para testes)
│   ├── main.js         comportamento do site
│   └── admin.js        comportamento do painel
└── img/                aquarela, folhagens, fotos dos presentes
```

---

## 1. Ver no computador

O site usa módulos JavaScript, então precisa de um servidor local — abrir o arquivo
com dois cliques não funciona. Na pasta `casamento mozar`:

```bash
python -m http.server 5173 --directory site
```

Depois abra <http://localhost:5173>. O painel fica em <http://localhost:5173/admin.html>.

Enquanto o Firebase não estiver configurado, o site roda em **modo local**: tudo
funciona de verdade (reserva, Pix, RSVP, painel), mas os dados ficam guardados apenas
no navegador de quem está testando. É o modo ideal para experimentar sem sujar nada.

---

## 2. Preencher antes de publicar

Tudo em `js/config.js`:

| Campo | O que colocar |
|---|---|
| `cerimonia.endereco` | endereço completo da Matriz Paróquia São Pedro Apóstolo |
| `cerimonia.mapsUrl` | link do Google Maps (botão **Compartilhar** no Maps). Vazio = busca pelo nome |
| `recepcao.endereco` / `recepcao.mapsUrl` | idem, para o Rancho Bela Vista |
| `pix.chave` | chave Pix dos noivos: CPF (só números), e-mail, telefone `+5567…` ou chave aleatória |
| `pix.nome` | máx. 25 caracteres, sem acento — é o que aparece no app de quem paga |
| `contato.whatsapp` | opcional, formato `5567999999999`, vira o link de dúvidas no rodapé |
| `dizeres` | os versaletes das laterais (abertura, aquarela e rodapé) |

Dois interruptores de layout, também em `js/config.js`:

| Campo | Opções |
|---|---|
| `contagem` | `'dias'` mostra só o número de dias, como o briefing pediu. `'completa'` mostra dias / horas / minutos / segundos, como na arte de referência. Trocar a palavra já muda o site. |
| `layoutPresentes` | `'carrossel'` desliza os presentes com setas e bolinhas, como na arte. `'grade'` mostra todos de uma vez — mais fácil de percorrer numa lista longa. |

E a lista de presentes em `js/data.js`: nome, categoria, preço, foto e o link do
produto no Mercado Livre.

> O QR Code do Pix é gerado no próprio navegador, sem intermediário e sem taxa.
> Quem paga vê o nome do presente no app do banco. Vale conferir o primeiro QR
> com um Pix de R$ 1 para você mesmo antes de publicar.

---

## 3. Ligar o Firebase (≈ 10 minutos)

1. Em <https://console.firebase.google.com> crie um projeto (pode desativar o Analytics).
2. **Build > Firestore Database > Criar banco de dados** → modo de produção → região `southamerica-east1`.
3. **Regras**: cole o conteúdo de `firestore.rules` e publique.
4. **Build > Authentication > Começar > E-mail/senha**: ative e, na aba *Users*,
   crie um usuário com o e-mail e a senha de vocês. É esse login que abre o painel.
5. **Visão geral do projeto > ícone `</>`** para registrar um app web. Copie o objeto
   `firebaseConfig` e cole em `FIREBASE`, no fim de `js/config.js`.
6. Recarregue o site: o aviso de "modo local" some do console e os dados passam a ser reais.

O plano gratuito (Spark) cobre com folga um casamento: são alguns milhares de
leituras e escritas por dia, e não expira.

---

## 4. Publicar

Qualquer hospedagem de site estático serve. A mais simples:

- **Netlify** — <https://app.netlify.com/drop>: arraste a pasta `site` para a página.
  Sai no ar em segundos, com HTTPS. Depois dá para apontar um domínio próprio.
- **Vercel** ou **Firebase Hosting** funcionam igual (`firebase deploy`).

Depois de publicar, gere o QR Code do convite impresso apontando para o endereço final.

Ao atualizar o CSS, troque o `?v=8` no fim do `<link>` em `index.html` e `admin.html`
para o número seguinte — isso força o navegador dos convidados a baixar a versão nova.

---

## 5. O painel (`/admin.html`)

Entre com o e-mail e a senha criados no passo 3.4. Ele tem três abas:

- **Presentes** — cada presente enviado, com quem enviou, a mensagem, se foi Pix ou
  loja e o valor. Botão **Confirmar** quando o Pix cair na conta ou a encomenda chegar.
- **Confirmações** — todos os RSVPs, com contato, acompanhantes e recado. Exporta CSV
  (abre direto no Excel).
- **Status da lista** — todos os presentes. **Liberar** devolve um presente à lista
  (para quem reservou e desistiu); **Marcar recebido** serve para quem presenteou por
  fora do site.

---

## 6. Como o controle de presentes funciona

O Mercado Livre não avisa ninguém quando alguém compra um produto — não existe API
pública para isso. Então o site resolve o problema no fluxo, não na integração:

1. O convidado clica em **Presentear** e escreve nome e mensagem.
2. **Se escolher a loja**, o presente é reservado *antes* de o link abrir. É isso que
   impede outra pessoa de comprar o mesmo item.
3. **Se escolher o Pix**, o site mostra o QR com o valor e o nome do presente; a
   reserva acontece quando ele confirma **Já fiz o Pix**.
4. Os noivos conferem no painel e marcam **Confirmado**.
5. Presentes escolhidos continuam na página, marcados com *Presenteado ♡*, e vão para
   o fim da lista.

O **Presente livre** é o único que nunca sai da lista: várias pessoas podem contribuir.

Sobre segurança: as regras do Firestore deixam qualquer visitante marcar um presente
livre como reservado (é o que permite presentear sem login) e ninguém consegue ler os
nomes, mensagens e confirmações — só quem entra no painel. Se alguém reservar por
engano ou brincadeira, é um clique em **Liberar** no painel.

---

## 7. Trocar as artes

As imagens em `img/identidade/` são **provisórias**, recortadas dos JPEGs da
identidade visual. Veja `ASSETS.md` para a lista exata do que enviar. Para trocar,
basta salvar o arquivo novo com o mesmo nome.

O monograma **ME** hoje é desenhado com a fonte Playfair Display. Quando o SVG oficial
chegar, ele entra no lugar dos elementos `.mono` do HTML.
