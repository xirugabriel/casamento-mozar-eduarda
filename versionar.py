#!/usr/bin/env python3
"""
Carimba uma versão nova nas URLs de CSS, JS e das imagens listadas abaixo.

Por que isso existe: o GitHub Pages serve tudo com Cache-Control: max-age=600.
Sem carimbo, depois de um deploy o navegador pode pegar o index.html novo e
continuar com o main.js velho por até 10 minutos — e um HTML novo rodando com
um JS velho não fica "desatualizado", fica quebrado (elemento existe, código
que preenche ele não). Com o carimbo, o HTML novo aponta para URLs que ainda
não estão em cache, então tudo troca junto.

Uso:
    python versionar.py          # carimba com a data e hora de agora
    python versionar.py 42       # carimba com um número à sua escolha

Rode antes de cada commit que mexa em CSS, JS ou nas imagens listadas em
IMAGENS_VERSIONADAS.
"""
import re
import sys
from datetime import datetime
from pathlib import Path

AQUI = Path(__file__).parent
PAGINAS = ['index.html', 'admin.html']
MODULOS = sorted(p.name for p in (AQUI / 'js').glob('*.js'))

# Imagens cujo conteúdo muda mantendo o mesmo nome de arquivo.
# Só entram aqui as que forem realmente substituídas — versionar todas faria
# cada convidado rebaixar o site inteiro a cada deploy.
IMAGENS_VERSIONADAS = [
    'img/identidade/aquarela.webp',
    'img/identidade/cachorras.webp',
    'img/monograma-ouro.svg',
]


def versao_nova() -> str:
    if len(sys.argv) > 1:
        return sys.argv[1]
    return datetime.now().strftime('%Y%m%d%H%M')


def carimbar(texto: str, alvo: str, v: str) -> tuple[str, int]:
    """Troca alvo ou alvo?v=algo por alvo?v=<v>, em qualquer aspas."""
    padrao = re.compile(re.escape(alvo) + r'(\?v=[\w.\-]+)?(?=["\'\s>])')
    novo, n = padrao.subn(f'{alvo}?v={v}', texto)
    return novo, n


def main() -> None:
    v = versao_nova()
    total = 0

    for nome in PAGINAS:
        arq = AQUI / nome
        if not arq.exists():
            continue
        txt = arq.read_text(encoding='utf-8')
        for alvo in ['css/style.css'] + [f'js/{m}' for m in MODULOS] + IMAGENS_VERSIONADAS:
            txt, n = carimbar(txt, alvo, v)
            total += n
        arq.write_text(txt, encoding='utf-8')

    # os imports estáticos entre módulos também precisam do carimbo: o
    # navegador trata './db.js' e './db.js?v=1' como arquivos diferentes
    for arq in (AQUI / 'js').glob('*.js'):
        txt = arq.read_text(encoding='utf-8')
        for m in MODULOS:
            txt, n = carimbar(txt, f'./{m}', v)
            total += n
        arq.write_text(txt, encoding='utf-8')

    print(f'versão {v} carimbada em {total} referências')


if __name__ == '__main__':
    main()
