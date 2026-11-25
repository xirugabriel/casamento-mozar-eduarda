# Site do casamento — Mozar & Eduarda

Site estático (HTML, CSS e JavaScript puros — sem build, sem framework) com dados no
**Cloud Firestore**. Abre o envelope verde, mostra a aquarela, conta os dias, leva aos
mapas, recebe presentes por Pix ou loja e confirma presenças.

```
site/
├── index.html          página do casamento
├── admin.html          painel dos noivos (/admin.html)
├── firestore.rules     regras de segurança do banco
├── functions/          servidor da lojinha (pagamento InfinitePay) — Firebase Functions
├── css/style.css       identidade visual inteira (paleta, tipografia, componentes)
├── js/
│   ├── config.js       ← ÚNICO arquivo do dia a dia: datas, locais, chave Pix, Firebase
│   ├── data.js         ← lista de presentes
│   ├── db.js           camada de dados (Firestore, com modo local para testes)
│   ├── main.js         comportamento do site
│   └── admin.js        comportamento do painel
└── img/
    ├── monograma.svg   monograma oficial (usado como máscara CSS)
    ├── identidade/     aquarela, igreja, recepção, RSVP, cachorras
    ├── flores/         recortes em aquarela com transparência
    └── presentes/      fotos dos presentes
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
| `checkout` | endereço das funções de pagamento, depois do deploy (seção 6). Vazio = "Presentear" avisa que a lista está sendo preparada |
| `contato.whatsapp` | opcional, formato `5567999999999`, vira o link de dúvidas no rodapé |
| `dizeres` | os versaletes das laterais (abertura, aquarela e rodapé) |

Dois interruptores de layout, também em `js/config.js`:

| Campo | Opções |
|---|---|
| `contagem` | `'dias'` mostra só o número de dias, como o briefing pediu. `'completa'` mostra dias / horas / minutos / segundos, como na arte de referência. Trocar a palavra já muda o site. |
| `layoutPresentes` | `'carrossel'` desliza os presentes com setas e bolinhas, como na arte. `'grade'` mostra todos de uma vez — mais fácil de percorrer numa lista longa. |

E a lista de presentes em `js/data.js`: nome, categoria, preço e foto. O mesmo
arquivo vai para o servidor a cada deploy, então o preço cobrado é sempre o da lista.

---

## 3. Ligar o Firebase (≈ 10 minutos)

1. Em <https://console.firebase.google.com> crie um projeto (pode desativar o Analytics).
2. **Build > Firestore Database > Criar banco de dados** → modo de produção → região `southamerica-east1`.
3. **Regras**: cole o conteúdo de `firestore.rules` e publique.
4. **Build > Authentication > Começar > E-mail/senha**: ative e, na aba *Users*,
   crie um usuário com o e-mail e a senha de vocês. Copie o UID desse usuário.
   Pelo console do Firestore, crie a coleção `administradores` e um documento
   com esse UID como ID. Pode usar o campo `nome` para identificar a pessoa.
   A existência do documento autoriza essa conta a consultar as respostas.
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

### Sobre o cache — rode `versionar.py` antes de cada deploy

O GitHub Pages envia `Cache-Control: max-age=600` em todos os arquivos. Sem
cuidado, depois de um `git push` o navegador pode pegar o `index.html` novo e
continuar com o `main.js` velho por até 10 minutos. E um HTML novo rodando com
JS velho não fica desatualizado: fica **quebrado** — o elemento existe na
página, o código que preenche ele não.

Para evitar isso, antes de commitar mudanças em CSS, JS ou nas imagens que
trocam de conteúdo mantendo o nome:

```bash
python versionar.py
```

Ele carimba uma versão nova (`?v=202609111953`) em três lugares: nas tags do
HTML, nos `import` entre os módulos JS — o navegador trata `./db.js` e
`./db.js?v=1` como arquivos diferentes — e nas imagens listadas em
`IMAGENS_VERSIONADAS`, dentro do próprio script.

Assim o HTML novo aponta para URLs que ainda não estão em cache, e tudo troca
junto. Quem abrir o site pela primeira vez também pega tudo certo.

Nem toda imagem é versionada de propósito: se todas fossem, cada convidado
rebaixaria o site inteiro a cada deploy. Só entram na lista as que forem
realmente substituídas mantendo o mesmo nome.


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

## 6. A lojinha (pagamento pela InfinitePay)

1. O convidado clica em **Presentear**, escreve nome e mensagem e vai para o pagamento.
2. O servidor (`functions/`) confere o preço na lista, **segura o presente por 20
   minutos** e pede à InfinitePay um link que vale esses mesmos 20 minutos.
3. O convidado paga com Pix ou cartão na página da InfinitePay e volta ao convite.
4. A InfinitePay avisa o servidor; o servidor **confirma com a InfinitePay** que o
   pagamento é real (o aviso não é assinado) e dá baixa: o presente vira
   *Presenteado ♡* e entra no painel já como recebido, com nome e mensagem.
5. Se ninguém pagar em 20 minutos, o presente volta sozinho para a lista.

O **Presente livre** nunca sai da lista: várias pessoas podem contribuir.
O convidado não consegue gravar nada nos presentes — só o servidor e o painel.

### Ligar (uma vez)

Pré-requisitos: plano **Blaze** no Firebase e, na InfinitePay, **Configurações do
Checkout › Habilitar checkout integrado** e uma **API Key** (começa com `inchk_`).

```bash
npm install -g firebase-tools
firebase login                                       # conta dona do projeto
echo INFINITEPAY_HANDLE=suatag > functions/.env      # InfiniteTag, sem o $
firebase functions:secrets:set INFINITEPAY_API_KEY   # cole a chave quando pedir
cd functions && npm install && cd ..
firebase deploy --only firestore:rules,functions
```

Depois preencha `checkout` em `js/config.js` com
`https://southamerica-east1-casamento-76063.cloudfunctions.net` e publique o site.
Faça um teste de verdade com um presente livre de R$ 10 (a InfinitePay não tem
ambiente de testes) e confira o pagamento no painel e no app da InfinitePay.

---

## 7. Trocar as artes

As artes definitivas já estão no site: monograma oficial, aquarela, igreja, recepção
e RSVP, mais nove recortes de flores com transparência. Os originais em alta ficam na
pasta do projeto, fora do repositório.

Falta só a foto de cada presente. Veja `ASSETS.md` para tamanhos e nomes de arquivo.

O monograma é `img/monograma.svg` aplicado como **máscara CSS**: o elemento `.mono`
fica vazio no HTML e o SVG recorta um fundo colorido. É o que permite pintá-lo com o
degradê dourado na abertura e de marrom no painel usando um arquivo só.
