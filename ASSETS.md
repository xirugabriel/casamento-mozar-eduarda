# Artes que o site precisa

Tudo que está em `img/identidade/` hoje foi **recortado dos JPEGs da identidade
visual** só para o site não ficar vazio. Funciona, mas está em baixa resolução e com
sobras das artes originais. Para trocar, salve o arquivo novo **com o mesmo nome** na
mesma pasta — nada mais precisa ser mexido.

## Prioridade alta

| Arquivo | O que é | Formato ideal |
|---|---|---|
| `img/identidade/aquarela.jpg` | A aquarela do casal com as cachorras e a capela — a mesma do forro do envelope. É a imagem principal do site. | JPG, **2000 px de largura**, horizontal, sem moldura nem fundo do envelope |
| `img/identidade/cachorras.png` | A ilustração das duas cachorras do fecho do site | **PNG com fundo transparente**, ~1200 px de largura |
| *(novo)* `img/identidade/monograma.svg` | O monograma **ME** oficial | SVG (ou PNG transparente, 800 px), em uma cor só — o site tinge de dourado ou madeira |

## Prioridade média

| Arquivo | O que é | Formato ideal |
|---|---|---|
| `img/identidade/igreja.jpg` | Foto ou aquarela da Matriz Paróquia São Pedro Apóstolo | JPG, 1400 px, vertical (3:4) |
| `img/identidade/recepcao.jpg` | Foto do Rancho Bela Vista | JPG, 1400 px, vertical (3:4) |
| `img/identidade/rsvp.jpg` | Imagem de apoio ao lado do formulário (o cartão RSVP fotografado serve muito bem) | JPG, 1200 px |

## Presentes

Uma foto por presente, em `img/presentes/`, quadrada ou 4:3, **800 px**, fundo claro e
neutro. O nome do arquivo deve bater com o `id` do presente em `js/data.js`:

```
img/presentes/jogo-panelas.jpg
img/presentes/cafeteira.jpg
img/presentes/jogo-cama.jpg
…
```

Depois é só apontar no `js/data.js`:

```js
{ id: 'jogo-panelas', …, img: 'img/presentes/jogo-panelas.jpg', link: 'https://…' }
```

Enquanto a foto não chegar, o presente usa `img/presentes/_placeholder.svg`, uma
folhagem discreta na paleta do casamento — dá para publicar assim sem parecer quebrado.

## O que **não** precisa ser enviado

As folhagens (`ramo-1.svg`, `ramo-2.svg`, `sprig.svg`, `divisor.svg`) foram desenhadas
em vetor na cor verde-sálvia da identidade. São leves, nítidas em qualquer tela e já
estão posicionadas nos cantos. Se preferir as folhagens originais da papelaria, mande
em PNG transparente que eu troco.
