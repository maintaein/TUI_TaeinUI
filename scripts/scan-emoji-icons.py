#!/usr/bin/env python3
"""이모지로 구현된 아이콘 자리를 전수 조사한다 (M4.5 T4 검증용).

범위: packages/demo/src + packages/docs/stories
practiceIcon(Do/Don't 마커 44곳)은 범위 밖이라 제외한다.
실행: python scripts/scan-emoji-icons.py
0곳이 나오면 T4가 닫혔다.
"""
import io, os, re, sys

PROP = re.compile(r'((?:left|right)?[Ii]con)=(["\'])([^"\']{1,4})\2')
# 태그 사이 짧은 텍스트(12자 이하). 이모지+단어 혼합(<div>📦 Store</div>)도 잡는다. 이모지가 없으면 EMO 검사에서 걸러진다.
CHILD = re.compile(r'>\s*([^<>{}]{1,12}?)\s*<')
# 태그 없이 줄에 이모지 한 덩어리만 있는 경우 (<button>⏎  ❓⏎</button>)
LINE = re.compile(r'^\s*([^\s<>{}]{1,4})\s*$')
FIELD = re.compile(r"icon:\s*'([^']{1,4})'")
EMO = re.compile('[\U0001F000-\U0001FAFF←-⇿ℹ⌀-➿⬀-⯿]')

def has_emo(t):
    # 본문 산문 강조 이모지(💡 ✅)는 아이콘 자리가 아니라 범위 밖이다.
    return EMO.search(t.replace('💡', '').replace('✅', ''))

def walk():
    for root in ("packages/demo/src", "packages/docs/stories"):
        yield from os.walk(root)

rows = []
for dp, _, fns in walk():
    for fn in sorted(fns):
        if not fn.endswith(('.tsx', '.ts')):
            continue
        p = os.path.join(dp, fn).replace("\\", "/")
        for i, l in enumerate(io.open(p, encoding='utf-8'), 1):
            if 'practiceIcon' in l:
                continue
            for m in PROP.finditer(l):
                if has_emo(m.group(3)) or m.group(3) in '+-':
                    rows.append((p, i, m.group(0), "prop"))
            for m in CHILD.finditer(l):
                if has_emo(m.group(1)):
                    rows.append((p, i, m.group(1), "children"))
            m = LINE.match(l)
            if m and has_emo(m.group(1)):
                rows.append((p, i, m.group(1), "line"))
            for m in FIELD.finditer(l):
                rows.append((p, i, "icon: '" + m.group(1) + "'", "data"))

for p, i, t, k in rows:
    sys.stdout.buffer.write(f"{p}:{i}  [{k}]  {t}\n".encode('utf-8'))
sys.stdout.buffer.write(f"\nTOTAL {len(rows)}\n".encode('utf-8'))
sys.exit(1 if rows else 0)
