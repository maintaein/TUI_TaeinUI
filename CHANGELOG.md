# 변경 기록

이 파일은 [`@taein-ui/core`](./packages/core)의 공개 변경을 기록합니다.
형식은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/)를 따르고,
버전은 [Semantic Versioning](https://semver.org/lang/ko/)을 따릅니다 — 다만 `0.x`이므로
마이너 올림(`0.3.0` → `0.4.0`)이 breaking change를 담을 수 있습니다.

**0.4.0 이전 기록은 없습니다.** `0.2.0`(구 scope `@taein-designsystem/core`)과 `0.3.0`(신 scope
`@taein-ui/core`)의 변경은 이 파일이 만들어지기 전에 발행됐습니다 — 그 구간은 git 히스토리를
참조하세요. 기억에 의지해 소급 작성하는 대신 공백으로 둡니다(2026-10-01 결정).

## 작성 규칙

- 분류는 `Added` · `Changed` · `Deprecated` · `Removed` · `Fixed` · `Security` 여섯 개만 씁니다.
- 공개 API를 깨뜨리는 항목은 줄머리에 **`BREAKING CHANGE:`** 를 붙입니다.
- 소비자가 할 일이 있으면 그 줄에 적습니다 — "대신 X를 쓰세요" 수준으로 구체적으로.
- 내부 구현 변경은 적지 않습니다. 공개 표면이 바뀐 것만 적습니다.
- 발행하지 않은 변경은 `[Unreleased]`에 쌓고, 발행 시점에 버전 제목으로 옮깁니다.

## [Unreleased]

[M5(컴포넌트 리뷰 반영)](<./.claude/고도화/plan/M5(컴포넌트-리뷰-반영).md>)의 각 패스가 공개
표면을 바꿀 때 그 패스 안에서 여기에 항목을 추가합니다.

### Added

- `Border`에 `glow` prop(`boolean`, 기본값 `false`)을 추가했습니다. 호버·포커스 시 테두리를 따라 도는 빛을 켭니다. `sides="all"`일 때만 나타납니다.
- `animation.loop.slow`(`6000ms`) 토큰을 추가했습니다. `prefers-reduced-motion: reduce`에서는 다른 `loop` 토큰처럼 `0.01ms`로 내려갑니다.
- `Avatar`에 `bouncy` prop(`boolean`, 기본값 `false`)을 추가했습니다. 호버나 키보드 포커스(`:focus-visible`)에 위로 튀며 떠오르고, 누르면(포인터, `Enter`, `Space`) 떠오른 채 커집니다. `onClick` 또는 `href`가 있어 클릭할 수 있는 아바타에서만 동작하고 아니면 무시됩니다. `Popover`의 트리거로 쓰면 `Popover`가 `onClick`을 넘기므로 동작합니다. 켜면 `clickable`의 `transform` 트랜지션과 `:active` 축소는 빠지고 `filter` 호버 밝기는 남습니다. `AvatarGroup` 안에서는 떠오른 아바타가 이웃 위로 올라옵니다. `prefers-reduced-motion: reduce`에서는 움직이지 않습니다. 켜지 않으면 동작이 이전과 같습니다.
- `IconButton`에 `hoverEffect` prop(`'none' | 'directional'`, 기본값 `'none'`)을 추가했습니다. `'directional'`이면 마우스가 들어온 가장 가까운 모서리에서 호버 색이 밀려 들어오고, 나갈 때는 나가는 쪽 모서리로 빠집니다. 색은 그 버튼의 호버·누름 색과 같고 `ghost`·`weak`·`strong` 세 모드에서 동작합니다. 켜면 버튼 자신의 호버 배경은 바뀌지 않고(층이 그 일을 합니다) 글자색만 지금처럼 바뀝니다. 마우스만 받고 터치와 키보드 포커스에는 효과가 없으며, `disabled`·`loading`에서도 없습니다. `prefers-reduced-motion: reduce`에서는 색이 바로 바뀝니다. 켜지 않으면 동작과 DOM이 이전과 같습니다.

### Removed

- **BREAKING CHANGE:** `LoadingSpinner`를 제거했습니다. `Loader`가 같은 기능을 덮습니다. `<LoadingSpinner type="dots" size="sm" color="#f00" />` → `<Loader type="dots" size="sm" color="#f00" />`
- **BREAKING CHANGE:** `Icon` 컴포넌트와 `IconName`·`IconProps` 타입을 제거했습니다. 내장 아이콘 세트를 따로 공개하지 않습니다. `lucide-react` 같은 외부 아이콘 라이브러리를 `IconButton`의 `children`으로 넘기세요: `<IconButton aria-label="닫기"><X /></IconButton>` (`import { X } from 'lucide-react'`). 마운트 시 획이 그려지던 `draw` 모션도 함께 없어졌습니다.

### Changed

- `Button`의 호버 시 위로 뜨는(`translateY(-1px)`) 이동을 없앴습니다. 호버는 배경색만 바뀝니다. 호버 색은 `(hover: hover) and (pointer: fine)`일 때만 적용돼 터치 기기에서 탭 뒤 색이 들러붙지 않습니다.
- `Button`의 누름 효과(`scale(0.95)`와 눌린 색)가 입력 시간과 무관하게 완주합니다. 30ms 탭도 최소 90ms 동안 눌린 상태를 유지하고, 포인터뿐 아니라 `Enter`·`Space`도 같은 효과를 냅니다. 누름은 150ms로 단단하게 들어가고, 뗄 때는 200ms 동안 휴지 크기를 약 1% 넘어갔다 정착합니다(이전 `scale(0.98)`은 되밀림이 0.1px라 보이지 않았습니다). `prefers-reduced-motion: reduce`에서는 `scale`만 끄고 색 변화는 남깁니다.
- `Button`의 `weak` + `danger` 눌림이 호버와 구별되지 않던 것을 고쳤습니다. 호버와 같은 배경색 위에서 `filter: brightness(0.96)`로 배경과 글자를 함께 8.6% 어둡게 해 눌린 상태가 보이고 글자 대비는 AA(4.546:1)를 지킵니다.
- **BREAKING CHANGE:** `Border`의 `rounded` 기본값이 `sides="all"`일 때 `'none'`에서 `'md'`로 바뀌었습니다. 부분 `sides`(`top`·`bottom` 등)는 선 끝이 휘지 않도록 `'none'`을 유지합니다. 이전처럼 각진 모서리를 원하면 `<Border rounded="none">`으로 명시하세요.
- **BREAKING CHANGE:** `Border`의 호버·포커스 빛(glow)이 기본으로 꺼집니다. 이전에는 `sides="all"`이면 항상 렌더됐습니다. 켜려면 `<Border glow>`로 넘기세요.
- **BREAKING CHANGE:** `Popover`의 `children`이 단일 요소여야 합니다. 트리거 속성(`onClick`·`aria-haspopup`·`aria-expanded`·`aria-controls`)이 감싸는 `div`가 아니라 그 요소에 직접 붙습니다. 문자열이나 여러 요소를 넘겼다면 `Button` 같은 상호작용 요소 하나로 감싸세요: `<Popover content={...}><Button>열기</Button></Popover>`. `Avatar`는 `onClick` 없이도 트리거로 쓸 수 있습니다.
- `Avatar`가 `onClick`이나 `href`가 있어 `button`·`a`로 렌더링될 때, `aria-*` 속성이 안쪽 `<img>`가 아니라 그 버튼·링크에 붙습니다. 소비자가 넘긴 `aria-label`이 `alt`로 만든 기본 이름을 덮습니다.
- `Popover`가 `scale(0.6)`에서 300ms 동안 살짝 넘쳤다 정착하며 튀어 오릅니다(이전에는 `scale(0.95)`에서 시작했습니다). 불투명도는 150ms에 먼저 끝나고, 퇴장은 195ms입니다.
- **BREAKING CHANGE:** `Tooltip`의 `children`이 단일 요소여야 합니다. `aria-describedby`가 감싸는 `div`가 아니라 그 요소에 직접 붙어, 스크린 리더가 버튼에서 툴팁을 읽습니다. 요소가 이미 `aria-describedby`를 가졌다면 공백으로 합쳐집니다. `Tooltip`에 직접 넘긴 `onClick`과 `aria-*`도 감싸는 `div`가 아니라 그 요소로 갑니다(`<Tooltip aria-label="저장" onClick={...}>`처럼 단독으로 써도 같습니다). `Popover` 안에 넣으면 `Popover`가 단 `onClick`과 `aria-*`도 그 요소로 넘어갑니다: `<Popover content={...}><Tooltip content="더보기"><IconButton aria-label="더보기" /></Tooltip></Popover>`. 문자열이나 여러 요소를 넘겼다면 요소 하나로 감싸세요. 호버·포커스 핸들러는 계속 감싸는 `div`에 있어, 포인터를 툴팁 위로 옮겨도 닫히지 않습니다. 자식과 `Tooltip` 중 아무도 `onClick`을 주지 않았다면 자식에 `onClick`을 넘기지 않습니다(`<Tooltip><Avatar alt="..." /></Tooltip>`의 `Avatar`가 동작 없는 `button`이 되지 않습니다).
- `Tooltip`이 `scale(0.8)`에서 200ms 동안 살짝 넘쳤다 정착하며 튀어 오릅니다(이전에는 크기 변화 없이 `translateY` 2px만 움직였습니다). 불투명도는 150ms에 먼저 끝나고, 퇴장은 130ms입니다. `Popover`보다 작고 짧게 움직입니다.
- `Tooltip`을 연달아 볼 때 빨라졌습니다. 다른 툴팁이 열려 있거나 방금(300ms 이내) 닫혔으면 다음 툴팁은 `delay`를 기다리지 않고 등장 전이 없이 바로 뜨고, 열려 있던 툴팁은 닫기 유예와 퇴장 전이 없이 곧바로 사라집니다. 툴바를 훑을 때 첫 툴팁만 튀어 오르고 두 툴팁이 동시에 보이는 순간이 없습니다. 제어 모드(`open`)인 툴팁은 `onOpenChange(false)`로 닫기를 요청받습니다. 이를 따르지 않는 부모는 그대로 열어 둘 수 있습니다. 동작을 끄는 prop은 없습니다.
- `Border` 빛이 한 바퀴 도는 시간을 1500ms(`loop.base`)에서 6000ms(`loop.slow`)로 늘려 느린 환경광으로 바꿨습니다. 호버로 켜지는 빛은 `(hover: hover) and (pointer: fine)`일 때만 적용돼 터치 기기에서 탭 뒤 빛이 들러붙지 않습니다. 키보드 포커스(`:focus-within`)는 포인터 종류와 무관하게 켜집니다.
- `BottomSheet`가 튀며 올라오고 내용이 뒤따라 떠오르며 열린 동안 둥실거립니다. 시트는 목표를 16px(높이와 무관한 고정 크기) 지나쳤다가 300ms + 200ms에 걸쳐 앉습니다. 내용 영역의 직계 자식은 시트가 거의 올라온 시점(300ms의 60%)부터 0.045초 간격으로(처음 8개까지) 24px 아래에서 떠오르고, 불투명도는 150ms에 먼저 끝납니다. 등장이 끝나면 3초 주기로 3px 오르내리며(`translate`), 드래그 중과 닫는 동안은 멈춥니다. 바닥에 틈이 보이지 않도록 시트가 아래로 32px 이어집니다. 목록을 한 요소로 감싸면 그 요소 하나가 떠오르니, 항목마다 시차를 받으려면 직접 `children`으로 넘기세요. 축소 모션 선호에서는 모두 즉시 끝 상태가 됩니다.
- **BREAKING CHANGE:** `IconButton`의 `ghost` prop을 없애고 `buttonStyle` 하나로 합쳤습니다. 값은 `'ghost' | 'weak' | 'strong'`이고 기본값은 `'ghost'`입니다. 예전 `fill`은 `strong`으로 이름이 바뀌었고 `weak`는 그대로입니다. `variant`는 `weak`와 `strong`에만 적용됩니다(`ghost`는 회색 고정). 옮기는 법: `<IconButton ghost>`는 `<IconButton>`으로, 아무것도 안 준 `<IconButton>`(예전 `fill`)과 `<IconButton ghost={false}>`는 `<IconButton buttonStyle="strong">`으로, `buttonStyle="fill"`은 `buttonStyle="strong"`으로 바꾸세요.
- `IconButton`의 누름과 호버가 `Button`과 같아졌습니다. 호버는 배경색(과 글자색)만 바뀌고 위로 뜨던 `translateY(-1px)`는 없어졌습니다. 누름은 `scale(0.95)`로 입력 시간과 무관하게 최소 90ms 완주하고 `Enter`·`Space`도 같은 효과를 냅니다. `ghost`의 `scale(0.92)`와 아이콘 칸이 40ms 늦게 눌리던 효과도 없어졌습니다. `IconButton`에 `'use client'`가 붙습니다.
- `IconButton`의 아이콘 크기를 버튼 `size`가 정합니다. 칸 안의 `svg`가 `1em`(18/22/26/30px)이라 어느 아이콘 라이브러리의 아이콘이든 같은 크기로 맞춰집니다. 아이콘의 `size` prop(예: lucide `size={22}`)은 SVG 속성이라 이 규칙에 집니다. 크기를 바꾸려면 아이콘에 `className`이나 `style`로 주세요. 소비자의 전역 요소 규칙(예: `svg { width: 24px }`)에도 집니다. 클래스와 `style`은 이깁니다.

### Fixed

- `Avatar`의 상태 배지(`status`)가 원형 아바타에서 오른쪽 아래가 깎여 반만 보이던 것을 고쳤습니다. 이미지와 이니셜을 모양대로 깎는 클립을 루트에서 안쪽 래퍼로 옮겨, 배지가 클립 밖에서 온전히 보입니다. 루트의 배경색과 `borderRadius`는 그대로입니다. `Avatar`의 자식 DOM이 `span` 하나 더 깊어졌으므로, 아바타 내부를 직접 선택하는 CSS가 있다면 확인하세요.
