# Artes do site

## O que já está no site (arte definitiva)

| Arquivo | Origem | Observação |
|---|---|---|
| `img/monograma.svg` | `ME.svg` | Monograma oficial. Usado como **máscara CSS**, então o site pinta ele de dourado na abertura e de marrom no painel sem precisar de outro arquivo. |
| `img/identidade/aquarela.webp` | `AQUARELA.jpeg` | 1400px. A imagem principal do site. |
| `img/identidade/igreja.webp` | `cerimonia.jpeg` | 900px, vertical. |
| `img/identidade/recepcao.webp` | `recepção.jpeg` | 900px, vertical. |
| `img/identidade/rsvp.webp` | `rsvp.jpeg` | 1100px, quadrada. |
| `img/identidade/aquarela.jpg` | `AQUARELA.jpeg` | 1200px, **só** para a prévia do link no WhatsApp — que falha acima de ~300KB, por isso essa versão separada. |
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
