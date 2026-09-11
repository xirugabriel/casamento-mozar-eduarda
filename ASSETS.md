# Artes do site

## O que já está no site (arte definitiva)

| Arquivo | Origem | Observação |
|---|---|---|
| `img/monograma-lacre.svg` | `ME.svg` | Monograma em cera dourada, como o lacre do convite. Usado na abertura e no rodapé. O relevo vem de iluminação SVG (`feDiffuseLighting` + `feSpecularLighting` sobre a silhueta amaciada). O que faz ler como ouro é a faixa tonal larga somada a um reflexo **estreito** — reflexo largo e difuso é o que parece plástico. |
| `img/monograma.svg` | `ME.svg` | A forma limpa, sem relevo. Serve de **máscara CSS** para a marca d'água da abertura e para o monograma do painel. |
| `img/identidade/aquarela.webp` | `AQUARELA.png` | 1600px, **com transparência preservada**. A borda esfumada da arte se dissolve no marfim da seção, sem moldura nem recorte reto. |
| `img/identidade/igreja.webp` | `cerimonia.jpeg` | 1400px, horizontal. |
| `img/identidade/recepcao.webp` | `recepção.jpeg` | 1400px, horizontal. |
| `img/identidade/rsvp.webp` | `rsvp.jpeg` | 1400px, horizontal. |
| `img/identidade/aquarela.jpg` | `AQUARELA.png` | 1200px, **só** para a prévia do link no WhatsApp. Achatada sobre o marfim porque JPEG não tem transparência, e mantida abaixo de 300KB — acima disso o WhatsApp desiste de montar o cartão. |
| `img/flores/*.webp` | `flores1-5.png` e os quatro PNGs de canto | Nove recortes com transparência. Seis em uso, três de reserva. |

Os originais (3 a 5 MB cada) ficam na pasta do projeto, **fora** do repositório —
não vão para o ar. Só as versões reduzidas são publicadas.

### Onde cada flor está

| Arquivo | Seção |
|---|---|
| `canto-flores.webp` | abertura, canto superior esquerdo |
| `haste-branca.webp` | abertura, lateral direita |
| `ramo-horizontal.webp` | contagem regressiva, as duas laterais |
| `canto-rosa.webp` | lista de presentes, canto superior direito |
| `ramo-fino.webp` | confirmação de presença, canto inferior esquerdo |
| `ramo-cheio.webp` | rodapé, as duas pontas |
| `cluster-creme.webp`, `canto-ocre.webp`, `canto-verde.webp` | reserva, não usadas |

Para trocar uma flor de lugar, basta mudar o `src` no `index.html` — tamanho,
posição e opacidade de cada uma ficam em `css/style.css`, nas classes `.folha--*`.

---

## O que ainda falta

### Fotos dos presentes (única pendência real)

Uma foto por presente, em `img/presentes/`, quadrada ou 4:3, **800px**, fundo claro e
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

Sem a foto, o presente usa `img/presentes/_placeholder.svg`, uma folhagem discreta na
paleta do casamento — dá para publicar assim sem parecer quebrado.

### Ilustração das cachorras (opcional)

`img/identidade/cachorras.webp` ainda é um recorte do JPEG da identidade visual: o
fundo de papel foi removido por limiar de luminosidade, o que funciona bem mas come um
pouco dos traços mais claros. Se o designer mandar o desenho em **PNG com fundo
transparente**, fica perfeito. É a última arte provisória do site.
