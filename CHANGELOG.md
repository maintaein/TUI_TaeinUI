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
- `Border` 빛이 한 바퀴 도는 시간을 1500ms(`loop.base`)에서 6000ms(`loop.slow`)로 늘려 느린 환경광으로 바꿨습니다. 호버로 켜지는 빛은 `(hover: hover) and (pointer: fine)`일 때만 적용돼 터치 기기에서 탭 뒤 빛이 들러붙지 않습니다. 키보드 포커스(`:focus-within`)는 포인터 종류와 무관하게 켜집니다.
