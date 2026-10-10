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
- `IconButton`에 `hoverEffect` prop(`'none' | 'jelly'`, 기본값 `'jelly'`)을 추가했습니다. 기본으로 켜져 있어 prop 없이 쓴 `IconButton`도 마우스가 들어올 때 아이콘이 부피를 지키며 옆으로 퍼졌다가(`scaleX 1.15`, `scaleY` 1/1.15) 출렁이며 돌아옵니다. 아이콘 칸만 움직이고 버튼은 그대로이며, 도는 중에 다시 들어오면 무시합니다. 마우스만 받고 터치와 키보드 포커스에는 효과가 없으며, `disabled`·`loading`에서도 없습니다. `prefers-reduced-motion: reduce`에서는 움직이지 않습니다. `hoverEffect="none"`으로 끄면 동작과 DOM이 이전과 같고, 도는 중에 끄면 타임라인을 죽이고 아이콘을 원래 모양으로 돌립니다. `BottomSheet`, `SideSheet`, `Snackbar`의 닫기 버튼도 기본값을 따라 젤리가 됩니다.
- `TextField`에 `multiline` prop(`boolean`, 기본값 `false`)을 추가했습니다. 켜면 `textarea`를 그립니다. `rows`(보이는 줄 수, 기본값 `4`)와 `autoResize`(내용에 맞춰 높이가 늘어남, 기본값 `false`)는 `multiline`일 때만 받고, 단일 줄에 주면 타입 오류입니다. `multiline`에는 `type`이 없습니다. `ref`는 단일 줄이면 `HTMLInputElement`, `multiline`이면 `HTMLTextAreaElement`입니다. 라벨, 도움말, 에러, 필수 표시, `size`, `fullWidth`는 단일 줄과 같습니다. `multiline`은 `true`나 `false` 리터럴로 씁니다. 변수로 넘기려면 삼항으로 갈라 두 번 쓰거나, 감싸는 컴포넌트의 props를 `ComponentProps<typeof TextField>`로 받으세요. `multiline`을 바꾸면 다른 요소라 다시 마운트되어 포커스와 비제어 값이 사라집니다.
- `Slider`에 `variant` prop(`'default' | 'bar' | 'wake'`, 기본값 `'default'`)을 추가했습니다. `bar`는 머리를 투명하게 해 채움 막대가 값을 보여 주고(머리 자리는 그대로라 잡고 끌 수 있습니다), 트랙이 8px로 조금 더 두꺼우며(호버 12px) 키보드 포커스는 트랙 둘레의 링으로 보입니다. `wake`는 트랙 선 대신 눈금 막대(2px, 쉬는 높이 6px)로 라인을 나눕니다. 막대는 트랙 폭 8px마다 하나씩(8~160개, 1280px 트랙까지 간격 8px) 놓이고 폭이 바뀌면 개수가 맞춰집니다. 값이 바뀌면(드래그, 키보드, 클릭 모두) 머리 뒤로 막대들이 머리 속도에 비례해 머리와 같은 높이인 24px까지 물결처럼 솟았다 가라앉으며, 물결은 머리 바깥 약 48px까지 퍼집니다. 움직임 줄이기 설정에서는 물결 없이 막대 색만 값을 따릅니다.

### Removed

- **BREAKING CHANGE:** `LoadingSpinner`를 제거했습니다. `Loader`가 같은 기능을 덮습니다. `<LoadingSpinner type="dots" size="sm" color="#f00" />` → `<Loader type="dots" size="sm" color="#f00" />`
- **BREAKING CHANGE:** `Icon` 컴포넌트와 `IconName`·`IconProps` 타입을 제거했습니다. 내장 아이콘 세트를 따로 공개하지 않습니다. `lucide-react` 같은 외부 아이콘 라이브러리를 `IconButton`의 `children`으로 넘기세요: `<IconButton aria-label="닫기"><X /></IconButton>` (`import { X } from 'lucide-react'`). 마운트 시 획이 그려지던 `draw` 모션도 함께 없어졌습니다.
- **BREAKING CHANGE:** `FormField`와 `FormFieldProps`·`FormFieldRenderProps` 타입을 공개 export에서 내렸습니다. `TextField`·`NumericSpinner`가 라벨, 필수 표시, 도움말, 에러 메시지와 그 사이의 연결을 이미 내장하고 있어 직접 쓸 일이 없습니다(코드는 내부 전용으로 남아 이 둘이 계속 씁니다). 옮기는 법: 라벨·도움말·에러가 필요한 입력은 `<TextField label="이름" helperText="..." error errorMessage="..." required />`처럼 `TextField`의 `label`·`helperText`·`error`·`errorMessage`·`required`를 쓰세요. 다른 입력 요소를 감싸려던 경우는 표준 `<label htmlFor>`와 `aria-describedby`를 직접 연결하세요.
- **BREAKING CHANGE:** `TextArea`와 `TextAreaProps` 타입을 제거했습니다. `TextField`의 `multiline`이 대신합니다. 옮기는 법: `<TextArea label="소개" />`는 `<TextField label="소개" multiline />`으로 바꾸세요. `height={n}`은 `rows`(줄 수)나 `style={{ minHeight: n }}`(픽셀 높이)로 바꾸고, `autoResize`는 그대로 씁니다. 기본 높이는 120px 최소 높이에서 `rows` 4줄로 바뀝니다. 줄 수가 다르면 `rows`로 맞추세요. `ref`는 그대로 `HTMLTextAreaElement`입니다. 이전에 `TextArea`는 바깥에 `size`별 안쪽 여백을 한 겹 더 두르고 있었는데, 그 여백이 없어져 입력창이 래퍼에 딱 붙습니다. 좌우 안쪽 여백은 `sm`이 0.75rem에서, `lg`가 1.25rem에서 모두 1rem(단일 줄 값)으로 바뀝니다.

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
- `IconButton`의 누름과 호버가 `Button`과 같아졌습니다. 호버에서 버튼은 배경색(과 글자색)만 바뀌고 위로 뜨던 `translateY(-1px)`는 없어졌습니다. 아이콘은 기본으로 젤리처럼 움직입니다(`hoverEffect="none"`으로 끕니다). 누름은 `scale(0.95)`로 입력 시간과 무관하게 최소 90ms 완주하고 `Enter`·`Space`도 같은 효과를 냅니다. `ghost`의 `scale(0.92)`와 아이콘 칸이 40ms 늦게 눌리던 효과도 없어졌습니다. `IconButton`에 `'use client'`가 붙습니다.
- `IconButton`의 `weak`·`strong` 색이 `Button`의 같은 조합과 같아졌습니다. `strong` `danger`는 휴지·호버·누름이 `error.main`·`error[800]`·`error[900]`으로 누를수록 진해집니다(예전에는 누르면 호버보다 밝아졌습니다). `strong` `light`와 `weak`의 `primary`·`danger`·`light`는 아이콘 색이 한 단계 이상 진해져 호버·누름에서도 대비 3:1 이상을 지킵니다.
- `IconButton`의 아이콘 크기를 버튼 `size`가 정합니다. 칸 안의 `svg`가 `1em`(18/22/26/30px)이라 어느 아이콘 라이브러리의 아이콘이든 같은 크기로 맞춰집니다. 아이콘의 `size` prop(예: lucide `size={22}`)은 SVG 속성이라 이 규칙에 집니다. 크기를 바꾸려면 아이콘에 `className`이나 `style`로 주세요. 소비자의 전역 요소 규칙(예: `svg { width: 24px }`)에도 집니다. 클래스와 `style`은 이깁니다.
- **BREAKING CHANGE:** `TextField`의 타이핑 효과를 없앴습니다. 글자가 한 자씩 나타나던 효과가 사라지고 브라우저 기본 입력이 됩니다. 입력한 글자는 `input`의 값 그대로 그려지므로 `type`과 관계없이 같게 동작합니다. 효과를 쓰던 코드는 고칠 것이 없지만, 보이는 모습이 달라집니다.
- `TextField`의 포커스 모양이 바뀌었습니다. 클릭과 키보드 모두 3px 후광과 2px 바깥 링이 없어지고, 호버와 같은 테두리 색(`primary.main`)으로 바뀝니다. 에러 상태의 포커스 후광도 없어지고 에러 테두리 색만 남습니다. 포커스 표시는 테두리 색 변화와 캐럿이 맡습니다.
- `Checkbox`가 체크할 때 상자가 먼저 안으로 움츠렸다가(`scale(0.88)`, 200ms) 되튀면서 상자 가운데에서 채움이 튀어나오듯 터지고, 채움이 한 번 넘치는 순간 상자가 최대 7%(`scale(1.0715)`) 살짝 부풀었다 돌아옵니다(이전에는 상자 배경색이 바뀔 뿐 상자는 움직이지 않았습니다). 체크 표시가 그어지는 효과는 그대로이고(300ms), 채움과 상자는 같은 500ms 스프링 하나를 따릅니다. 해제하면 획이 그은 순서를 거슬러 지워지고 채움(파란색)이 가운데로 빨려 들어간 뒤 상자가 되튑니다(195ms). 해제의 상자도 같은 만큼 움츠렸다가 스프링으로 되튀어, 체크와 해제가 같은 두 박자입니다. 체크의 상자 정점은 되튐과 부풂이 겹쳐 약 1.098배입니다. indeterminate 진입도 같습니다. `checked`와 `indeterminate` 사이는 지금처럼 모양만 바뀝니다. 키보드(`Space`)로 바꿀 때도 움직이고, 도중에 반대로 바뀌면 지금 값에서 이어집니다. `prefers-reduced-motion: reduce`에서는 즉시 바뀝니다. 상자 배경은 이제 체크로 바뀌지 않고 안쪽 채움 층이 색을 맡습니다. 비활성 + indeterminate는 예전에는 연한 배경 위 흰 대시라 거의 보이지 않았고, 이제는 회색(`text.disabled`) 채움 위에 대시가 보입니다.
- `Switch`가 켜지면 트랙 테두리까지 전부 파랗습니다(이전에는 트랙 둘레 2px에 회색 고리가 비쳤습니다). `error`일 때는 켜져도 에러 색 테두리가 고리로 남도록 파란 채움이 테두리 안쪽에만 깔립니다. 마우스가 올라가면 머리가 1.06배로 부풉니다(`(hover: hover) and (pointer: fine)`일 때만, 비활성이면 없음). 이동하는 동안 머리는 속도에 따라 가로로 늘었다가 도착하며 둥글어지고(가장 빠른 한가운데서 가장 길게 1.144배), 켜지면 트랙보다 위아래 1px씩 큰 크기로 머뭅니다(`md`에서 26px, 이동의 80% 시점에 부드럽게 커집니다). 꺼지면 같은 늘임으로 이동한 뒤 원래 크기로 돌아옵니다. 파란 채움도 같은 진행으로 머리를 따라가며, 차오르는 도중에도 트랙 알약 모양 안에서만 차오릅니다(회색 영역 밖으로 삐져나오지 않습니다). 이동은 300ms입니다. `sm`·`lg`도 같은 방식으로 트랙 높이에 2px를 더한 크기가 됩니다. 키보드(`Space`)로 바꿀 때도 움직이고, 도중에 반대로 바뀌면 지금 값에서 이어집니다. `prefers-reduced-motion: reduce`에서는 즉시 바뀝니다.
- `Slider`가 잡을 때 나오던 눈금(양옆 눈금과 놓은 자리 표시)을 없앴습니다. 값은 여전히 머리 위에서 따라붙습니다. 눈금이 필요하면 `variant="wake"`가 눈금 막대로 라인을 그립니다. 대신 마우스를 올리면(`(hover: hover) and (pointer: fine)`일 때만) 라인이 6px에서 9px로, 머리가 1.15배로 탄력 있게 부풉니다(둘 다 들어갈 때 300ms 스프링, 나올 때 200ms). 터치에서는 호버 효과가 없고, 움직임 줄이기 설정에서는 크기가 변하지 않으며, 비활성 슬라이더는 반응하지 않습니다.
- `Slider`의 라인(`default`·`bar`)이 끌면 머리 둘레에서 끄는 속도에 비례해 부풀어 물결칩니다. 라인 두께가 쉬는 6px(`bar` 8px)에서 최대 20px까지 부풀고 뒤쪽으로 더 길게 퍼지며, 멈추면 매끈한 선으로 돌아갑니다. 키보드와 클릭으로 값이 바뀌어도 같고, 움직임 줄이기 설정에서는 물결이 없습니다. 쉬는 모습은 그대로입니다. 라인은 이제 SVG 경로 하나로 그려지고, 마우스를 올릴 때의 두께 변화(6px에서 9px, `bar`는 8px에서 12px)는 CSS 전이가 아니라 GSAP이 맡습니다(들어갈 때 300ms 스프링, 나올 때 200ms). `wake`는 같은 물결을 눈금 막대로 보여 줍니다. 물결 세기는 트랙 길이가 아니라 머리가 움직이는 px 속도(960px/s에서 최대)로 재므로, 짧은 트랙과 긴 트랙에서 같은 손 속도는 같은 물결을 만듭니다. 머리는 값을 스프링으로 따라가고 그 속도를 한 번 더 스프링으로 걸러 세기를 정하므로, 세게 끌면 크게 약하게 끌면 작게 솟고 물결이 툭 튀지 않고 서서히 차오르며 서서히 가라앉습니다.

### Fixed

- `Avatar`의 상태 배지(`status`)가 원형 아바타에서 오른쪽 아래가 깎여 반만 보이던 것을 고쳤습니다. 이미지와 이니셜을 모양대로 깎는 클립을 루트에서 안쪽 래퍼로 옮겨, 배지가 클립 밖에서 온전히 보입니다. 루트의 배경색과 `borderRadius`는 그대로입니다. `Avatar`의 자식 DOM이 `span` 하나 더 깊어졌으므로, 아바타 내부를 직접 선택하는 CSS가 있다면 확인하세요.
