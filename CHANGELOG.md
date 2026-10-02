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

### Removed

- **BREAKING CHANGE:** `LoadingSpinner`를 제거했습니다. `Loader`가 같은 기능을 덮습니다. `<LoadingSpinner type="dots" size="sm" color="#f00" />` → `<Loader type="dots" size="sm" color="#f00" />`
- **BREAKING CHANGE:** `Icon` 컴포넌트와 `IconName`·`IconProps` 타입을 제거했습니다. 내장 아이콘 세트를 따로 공개하지 않습니다. `lucide-react` 같은 외부 아이콘 라이브러리를 `IconButton`의 `children`으로 넘기세요: `<IconButton aria-label="닫기"><X /></IconButton>` (`import { X } from 'lucide-react'`). 마운트 시 획이 그려지던 `draw` 모션도 함께 없어졌습니다.

### Changed

- `Button`의 호버 시 위로 뜨는(`translateY(-1px)`) 이동을 없앴습니다. 호버는 배경색만 바뀝니다. 호버 색은 `(hover: hover) and (pointer: fine)`일 때만 적용돼 터치 기기에서 탭 뒤 색이 들러붙지 않습니다.
- `Button`의 누름 효과(`scale(0.95)`와 눌린 색)가 입력 시간과 무관하게 완주합니다. 30ms 탭도 최소 90ms 동안 눌린 상태를 유지하고, 포인터뿐 아니라 `Enter`·`Space`도 같은 효과를 냅니다. 누름은 150ms로 단단하게 들어가고, 뗄 때는 200ms 동안 휴지 크기를 약 1% 넘어갔다 정착합니다(이전 `scale(0.98)`은 되밀림이 0.1px라 보이지 않았습니다). `prefers-reduced-motion: reduce`에서는 `scale`만 끄고 색 변화는 남깁니다.
- `Button`의 `loading`이 켜지면 라벨이 즉시 사라지며 폭이 튀던 것을 접힘 전이로 바꿨습니다. 라벨은 DOM에 남은 채 폭이 200ms 동안 줄어들고(`aria-hidden` 처리) 로더가 대신 보입니다. `prefers-reduced-motion: reduce`에서는 즉시 접힙니다. 누름이 끝날 때 버튼 안 글자가 한 번 튀던 것도 호버, 포커스, 눌림 중에만 레이어를 미리 만들어 없앴습니다.
