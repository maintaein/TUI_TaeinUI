// Stam "Stable Fluids"(1999)와 GPU Gems 1권 38장의 공개 알고리즘을 GLSL ES 3.00으로 새로 썼다.
// 속도 단위는 시뮬레이션 격자 셀/초다. 격자 가장자리는 CLAMP_TO_EDGE라 압력이 벽에서
// 거울처럼 접히고 속도는 바깥으로 흘러 나간다(연기가 화면 밖으로 빠지는 것이 목적이라 경계 처리를 따로 두지 않는다).

export const VERTEX = `#version 300 es
out vec2 vUv;
void main() {
  // 정점 버퍼 없이 화면을 덮는 큰 삼각형 하나
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const HEAD = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
out vec4 outColor;
`;

// 가우시안 한 방울을 더한다. 속도는 xy, 밀도는 x에 같은 셰이더로 넣는다.
// uAspect는 상자를 짧은 변 단위로 바꾸는 비(짧은 변 = 1)다.
export const SPLAT = `${HEAD}
uniform sampler2D uTarget;
uniform vec2 uPoint;
uniform vec3 uValue;
uniform vec2 uAspect;
uniform float uRadius;
void main() {
  vec2 d = (vUv - uPoint) * uAspect;
  vec3 splat = exp(-dot(d, d) / uRadius) * uValue;
  outColor = vec4(texture(uTarget, vUv).xyz + splat, 1.0);
}`;

// semi-Lagrangian 이류: 셀에서 속도만큼 거슬러 올라간 자리를 읽는다(선형 보간은 하드웨어).
// 감쇠를 같은 패스에서 한다.
export const ADVECT = `${HEAD}
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 uVelTexel;
uniform float uDt;
uniform float uDissipation;
void main() {
  vec2 coord = vUv - uDt * texture(uVelocity, vUv).xy * uVelTexel;
  outColor = texture(uSource, coord) / (1.0 + uDissipation * uDt);
}`;

export const CURL = `${HEAD}
uniform sampler2D uVelocity;
uniform vec2 uTexel;
void main() {
  float l = texture(uVelocity, vUv - vec2(uTexel.x, 0.0)).y;
  float r = texture(uVelocity, vUv + vec2(uTexel.x, 0.0)).y;
  float t = texture(uVelocity, vUv + vec2(0.0, uTexel.y)).x;
  float b = texture(uVelocity, vUv - vec2(0.0, uTexel.y)).x;
  outColor = vec4(0.5 * (r - l - t + b), 0.0, 0.0, 1.0);
}`;

// vorticity confinement: 소용돌이 중심으로 모으는 힘을 더해 수치 감쇠로 죽는 소용돌이를 살린다.
export const VORTICITY = `${HEAD}
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform vec2 uTexel;
uniform float uCurlStrength;
uniform float uDt;
void main() {
  float l = texture(uCurl, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture(uCurl, vUv + vec2(uTexel.x, 0.0)).x;
  float t = texture(uCurl, vUv + vec2(0.0, uTexel.y)).x;
  float b = texture(uCurl, vUv - vec2(0.0, uTexel.y)).x;
  float c = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(t) - abs(b), abs(r) - abs(l));
  force /= length(force) + 0.0001;
  force *= uCurlStrength * c;
  force.y *= -1.0;
  vec2 v = texture(uVelocity, vUv).xy + force * uDt;
  outColor = vec4(clamp(v, -1000.0, 1000.0), 0.0, 1.0);
}`;

export const DIVERGENCE = `${HEAD}
uniform sampler2D uVelocity;
uniform vec2 uTexel;
void main() {
  float l = texture(uVelocity, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture(uVelocity, vUv + vec2(uTexel.x, 0.0)).x;
  float t = texture(uVelocity, vUv + vec2(0.0, uTexel.y)).y;
  float b = texture(uVelocity, vUv - vec2(0.0, uTexel.y)).y;
  outColor = vec4(0.5 * (r - l + t - b), 0.0, 0.0, 1.0);
}`;

// 압력 푸아송 방정식의 Jacobi 한 번
export const PRESSURE = `${HEAD}
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
uniform vec2 uTexel;
void main() {
  float l = texture(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float t = texture(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  float b = texture(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  outColor = vec4((l + r + t + b - texture(uDivergence, vUv).x) * 0.25, 0.0, 0.0, 1.0);
}`;

// 속도에서 압력 기울기를 빼 발산 없는 장으로 만든다
export const GRADIENT = `${HEAD}
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
uniform vec2 uTexel;
void main() {
  float l = texture(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float r = texture(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float t = texture(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  float b = texture(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  vec2 v = texture(uVelocity, vUv).xy - 0.5 * vec2(r - l, t - b);
  outColor = vec4(v, 0.0, 1.0);
}`;

// 밀도 -> 알파. 곱셈형 포화(1 - e^-kd)라 겹쳐도 넘치지 않고 가장자리가 부드럽다.
// 캔버스는 premultiplied alpha라 색에 알파를 곱해 낸다.
const ALPHA = `float smokeAlpha(float density) { return 1.0 - exp(-density * 2.4); }`;

export const DISPLAY = `${HEAD}
${ALPHA}
uniform sampler2D uDye;
uniform vec3 uColor;
uniform float uFade;
void main() {
  float a = smokeAlpha(texture(uDye, vUv).x) * uFade;
  outColor = vec4(uColor * a, a);
}`;

// 수명 판정용. 밀도 격자를 16x16으로 줄여(칸당 4x4 표본) 칸의 최대 알파를 CPU가 읽게 한다.
// 평균은 쓰지 않는다. 넓은 화면에 가는 꼬리만 남았을 때 평균이 문턱 아래로 떨어져 보이는 연기를 접는다.
export const PROBE = `${HEAD}
${ALPHA}
uniform sampler2D uDye;
void main() {
  float peak = 0.0;
  for (int i = 0; i < 4; i++) {
    for (int j = 0; j < 4; j++) {
      vec2 off = ((vec2(float(i), float(j)) + 0.5) / 4.0 - 0.5) / 16.0;
      peak = max(peak, smokeAlpha(texture(uDye, vUv + off).x));
    }
  }
  outColor = vec4(peak, 0.0, 0.0, 1.0);
}`;
