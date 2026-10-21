---
version: 1
slug: 'packages-demo'
primary_target: 'packages/demo'
related_targets: []
---

# demo 앱 (TaeinUI 문서·쇼케이스)

범위: `packages/demo` 전체(공통 틀, 소개, 시작하기, 전체 컴포넌트, 컴포넌트 25페이지, 404). 방식: Experience(컴포넌트가 앞장선다), 문서 부분은 Read 규칙.

청중: 포트폴리오 링크로 들어온 평가자, 노트북에서 2~5분. 할 일: 진짜 컴포넌트를 보고 만지고 코드를 가져간다. 증거: 진짜 core 컴포넌트·실제 props·실제 코드. 제약: 색 토큰 유지(파랑 #1976D2, 흰 바탕, 회색 글), Pretendard, 사이드바 탐색 유지, 라우트 주소 불변, 새 의존성 없음, 한국어 어절 줄바꿈.

기억할 순간: 무대의 연출 커서가 대표 동작을 보이다가 진짜 손이 닿으면 멈추고 넘겨준다.

남은 결정: 무대 대본 25개는 모션-명제와 현재 구현을 대조해 쓴다(계획서 M6 7절 b).

## Direction contract

THESIS: 문서 사이트가 아니라 진짜 컴포넌트가 걸린 갤러리. 가운데 글과 오른쪽 목차가 주인인 기본 배치를 거부하고, 액자 속 무대가 페이지의 주인이다.

OWN-WORLD: 흰 바탕, 옅은 회색 액자 안의 흰 무대와 카드, 먹 글자와 TUI 파랑 하나. 떠 있는 알약 헤더, 눈금자 사이드바(지금 페이지는 긴 파란 눈금), 아주 큰 굵은 이름, 숫자와 코드만 고정폭. 그라데이션과 장식 그림자 없음.

STORY: 카드 벽에서 움직이는 컴포넌트를 골라 들어가, 무대에서 대표 모션을 클릭 없이 보고, 손으로 넘겨받아 조작판으로 바꾸며 코드를 가져간다.

FIRST VIEWPORT: 상세는 회색 캔버스 위에 번호와 계열, 큰 이름, 리드 한 줄, 아래로 화면 높이를 채우는 흰 무대와 일시정지 단추. 소개는 로고, TAEIN UI, 소개글, 설치 줄과 시작 버튼, 그 아래 쇼케이스 액자.

FORM: 갤러리. 시안 2판 셋(갤러리, 목차, 작업대) 중 사용자 선택, 참조 skiper-ui. 추첨 seed e77837ed의 방향은 1판에서 사용자가 대체.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
