// Stam 1999 "Stable Fluids"와 GPU Gems 1권 38장을 따라 새로 썼다(GLSL ES 3.00).
// 속도 단위는 시뮬레이션 격자 셀/초다. 텍스처는 CLAMP_TO_EDGE라 가장자리에서 압력이 접히고
// 속도는 바깥으로 흘러 나간다(연기가 화면 밖으로 빠지는 것이 목적이라 경계 처리를 따로 두지 않는다).

export const VERTEX = `#version 300 es
out vec2 vTexCoord;
void main() {
  // 정점 버퍼 없이 화면을 덮는 삼각형 하나: 정점 0, 1, 2가 (0,0), (2,0), (0,2)
  vec2 corner = vec2(float(gl_VertexID % 2), float(gl_VertexID / 2)) * 2.0;
  vTexCoord = corner;
  gl_Position = vec4(corner * 2.0 - 1.0, 0.0, 1.0);
}`;

// 모든 조각 셰이더의 머리. at()은 현재 칸에서 (dx, dy)칸 떨어진 값을 읽는다(uCell = 한 칸의 uv 크기)
const HEAD = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vTexCoord;
out vec4 fragValue;
uniform vec2 uCell;
vec4 at(sampler2D field, float dx, float dy) {
  return texture(field, vTexCoord + vec2(dx, dy) * uCell);
}
`;

// 가우시안 한 방울을 기존 값에 더한다. 속도는 xy, 밀도는 x에 같은 셰이더로 넣는다.
// uBoxRatio는 상자를 짧은 변 단위(짧은 변 = 1)로 바꾸는 비라 방울이 찌그러지지 않는다.
export const SPLAT = `${HEAD}
uniform sampler2D uBase;
uniform vec2 uCenter;
uniform vec3 uImpulse;
uniform vec2 uBoxRatio;
uniform float uRadiusSq;
void main() {
  vec2 offset = (vTexCoord - uCenter) * uBoxRatio;
  float weight = exp(-dot(offset, offset) / uRadiusSq);
  fragValue = vec4(texture(uBase, vTexCoord).xyz + weight * uImpulse, 1.0);
}`;

// GPU Gems 38장 식 q(x, t+dt) = q(x - dt u(x), t): 셀을 속도만큼 거슬러 올라간 자리를 읽는다.
// 감쇠는 곱셈 꼴 exp(-rate dt)라 프레임 길이에 상관없이 같은 속도로 흩어진다.
export const ADVECT = `${HEAD}
uniform sampler2D uVelocity;
uniform sampler2D uQuantity;
uniform float uDt;
uniform float uDecayRate;
void main() {
  vec2 origin = vTexCoord - uDt * texture(uVelocity, vTexCoord).xy * uCell;
  fragValue = texture(uQuantity, origin) * exp(-uDecayRate * uDt);
}`;

// 소용돌이도 ω = dv/dx - du/dy (2D에서는 z 성분 스칼라)
export const VORTICITY = `${HEAD}
uniform sampler2D uVelocity;
void main() {
  float dvdx = 0.5 * (at(uVelocity, 1.0, 0.0).y - at(uVelocity, -1.0, 0.0).y);
  float dudy = 0.5 * (at(uVelocity, 0.0, 1.0).x - at(uVelocity, 0.0, -1.0).x);
  fragValue = vec4(dvdx - dudy, 0.0, 0.0, 1.0);
}`;

// vorticity confinement(GPU Gems 38장): eta = grad|w|, N = eta / |eta|, f = e_c dx (N x w).
// 2D에서 N x (w z)는 (N.y w, -N.x w)다. |eta|가 0인 곳은 N을 0으로 두어 나눗셈을 피한다.
// 속도가 터지지 않게 길이를 uSpeedCap으로 눌러 둔다.
export const CONFINEMENT = `${HEAD}
uniform sampler2D uVelocity;
uniform sampler2D uVorticity;
uniform float uConfinement;
uniform float uDt;
uniform float uSpeedCap;
void main() {
  vec2 eta = 0.5 * vec2(
    abs(at(uVorticity, 1.0, 0.0).x) - abs(at(uVorticity, -1.0, 0.0).x),
    abs(at(uVorticity, 0.0, 1.0).x) - abs(at(uVorticity, 0.0, -1.0).x)
  );
  float etaLen = length(eta);
  vec2 n = etaLen > 1e-5 ? eta / etaLen : vec2(0.0);
  float w = texture(uVorticity, vTexCoord).x;
  vec2 force = uConfinement * vec2(n.y * w, -n.x * w);
  vec2 velocity = texture(uVelocity, vTexCoord).xy + force * uDt;
  float speed = length(velocity);
  if (speed > uSpeedCap) velocity *= uSpeedCap / speed;
  fragValue = vec4(velocity, 0.0, 1.0);
}`;

// div u = (u_R.x - u_L.x + u_T.y - u_B.y) / 2dx (dx는 한 칸이라 1)
export const DIVERGENCE = `${HEAD}
uniform sampler2D uVelocity;
void main() {
  float div = 0.5 * (
    at(uVelocity, 1.0, 0.0).x - at(uVelocity, -1.0, 0.0).x +
    at(uVelocity, 0.0, 1.0).y - at(uVelocity, 0.0, -1.0).y
  );
  fragValue = vec4(div, 0.0, 0.0, 1.0);
}`;

// 푸아송 방정식 lap p = div u의 Jacobi 한 번: p' = (p_L + p_R + p_B + p_T - div) / 4 (alpha = -dx^2, beta = 4)
export const PRESSURE = `${HEAD}
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
void main() {
  float neighbors =
    at(uPressure, -1.0, 0.0).x + at(uPressure, 1.0, 0.0).x +
    at(uPressure, 0.0, -1.0).x + at(uPressure, 0.0, 1.0).x;
  fragValue = vec4((neighbors - texture(uDivergence, vTexCoord).x) / 4.0, 0.0, 0.0, 1.0);
}`;

// u' = u - grad p. 결과는 발산이 없는 속도장이다
export const PROJECT = `${HEAD}
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
void main() {
  vec2 gradient = 0.5 * vec2(
    at(uPressure, 1.0, 0.0).x - at(uPressure, -1.0, 0.0).x,
    at(uPressure, 0.0, 1.0).x - at(uPressure, 0.0, -1.0).x
  );
  fragValue = vec4(texture(uVelocity, vTexCoord).xy - gradient, 0.0, 1.0);
}`;

// 밀도 -> 알파. 포화형 1 - e^(-k d)라 겹쳐도 넘치지 않고 가장자리가 부드럽다.
// 캔버스는 premultiplied alpha라 색에 알파를 곱해 낸다.
const ALPHA = `float smokeAlpha(float density) { return 1.0 - exp(-2.4 * density); }`;

// 화면 그리기. 세 가지를 한 번에 그린다(캔버스 CSS px 좌표, y 아래로).
// 1) 연기의 빛과 그늘: 밀도(알파)를 높이로 보고 기울기로 표면 방향을 잡아 왼쪽 위 빛을 받는 면은 uCore(흰색 토큰),
//    그늘진 면과 빛 쪽으로 밀도가 두꺼운 곳(빛 쪽으로 몇 걸음 밀도를 누적)과 안쪽 깊은 곳은 uColor(회색 토큰) 쪽이다.
// 2) 배기 기둥: 입에서 땅까지 곧게 내려오며 아래로 갈수록 넓어지는 밀도를 시뮬레이션 밀도에 더해 같은 음영으로 그린다.
// 3) 분출(광휘): 입 아래 짧은 심지(가운데 흰색, 바깥 분출 색, 아래로 가늘어지는 종 모양)와 반지름이 다른 빛무리 세 겹
//    (약 5px 진하게, 18px 옅게, 70px 아주 옅게). 빛무리는 근처 연기도 분출 색으로 물들인다.
// 분출 개수는 둘로 고정이다. 세기가 0이면 건너뛴다.
export const DISPLAY = `${HEAD}
${ALPHA}
uniform sampler2D uDensity;
uniform vec3 uColor;
uniform vec3 uCore;
uniform vec3 uJetColor;
uniform float uFade;
uniform vec2 uSize;
uniform float uTime;
uniform vec4 uJetA[2];
uniform vec4 uJetB[2];

float columnDensity(vec2 p) {
  float total = 0.0;
  for (int i = 0; i < 2; i++) {
    vec4 a = uJetA[i];
    vec4 b = uJetB[i];
    float t = (p.y - a.y) / max(b.z - a.y, 1.0);
    if (b.x > 0.0 && t > 0.0 && t < 1.0 && abs(p.x - a.x) < 80.0) {
      float spread = (4.0 + 26.0 * t * t) * (1.0 + 0.12 * sin(p.y * 0.12 - uTime * 9.0 + float(i) * 2.0));
      float across = (p.x - a.x) / spread;
      total += b.w * 0.7 * exp(-across * across) * smoothstep(0.0, 0.15, t) * (1.0 - smoothstep(0.7, 1.0, t));
    }
  }
  return total;
}

float shapeAt(vec2 uv) {
  float density = texture(uDensity, uv).x + columnDensity(vec2(uv.x, 1.0 - uv.y) * uSize);
  return smokeAlpha(density);
}

void main() {
  vec2 uv = vTexCoord;
  vec2 px = vec2(uv.x, 1.0 - uv.y) * uSize;
  float shape = shapeAt(uv);

  // 분출: 빛무리 합(haloSum)과 심지(wickSum, 가운데 비중 wickCore)
  // ponytail: 빛무리 반지름(5, 18, 70px)과 심지 폭은 px 고정이라 단추 높이가 44px에서 크게 다르면 어긋난다, 그런 사용처가 생기면 높이 비례 uniform으로
  float haloSum = 0.0;
  float wickSum = 0.0;
  float wickCore = 0.0;
  for (int i = 0; i < 2; i++) {
    vec4 a = uJetA[i];
    vec4 b = uJetB[i];
    // 멀리(150px 밖)는 빛이 0에 가까워 건너뛴다
    if (b.x > 0.0 && dot(px - a.xy, px - a.xy) < 22500.0) {
      vec2 dir = a.zw;
      vec2 d = px - a.xy;
      float along = dot(d, dir);
      float across = dot(d, vec2(-dir.y, dir.x));
      vec2 nearest = d - dir * clamp(along, 0.0, b.y);
      float r2 = dot(nearest, nearest);
      haloSum += b.x * (0.55 * exp(-r2 / 25.0) + 0.22 * exp(-r2 / 324.0) + 0.10 * exp(-r2 / 4900.0));
      if (along > 0.0 && along < b.y) {
        float u = along / b.y;
        float width = mix(3.5, 0.8, u);
        float bell = exp(-(across * across) / (width * width));
        float fall = (1.0 - u * u) * smoothstep(0.0, 1.5, along);
        wickSum += b.x * bell * fall;
        wickCore += b.x * bell * bell * fall;
      }
    }
  }

  // 연기 음영: 연기가 거의 없는 칸(대부분의 화면)은 건너뛴다. 알파가 0에 가까워 색이 보이지 않는다
  vec3 smoke = uColor;
  if (shape > 0.004) {
    vec2 eps = vec2(3.0) / uSize;
    vec2 slope = vec2(
      shapeAt(uv + vec2(eps.x, 0.0)) - shapeAt(uv - vec2(eps.x, 0.0)),
      shapeAt(uv + vec2(0.0, eps.y)) - shapeAt(uv - vec2(0.0, eps.y))
    );
    vec3 light = normalize(vec3(-0.55, 0.65, 0.5));
    vec3 normal = normalize(vec3(-5.0 * slope, 1.0));
    float facing = clamp(0.82 + 1.5 * (dot(normal, light) - light.z), 0.0, 1.0);
    vec2 toLight = normalize(light.xy) * 7.0 / uSize;
    float thick = 0.0;
    for (int k = 1; k <= 4; k++) thick += shapeAt(uv + toLight * float(k));
    float shade = 1.0 - 0.45 * clamp(thick * 0.5, 0.0, 1.0);
    float deep = 1.0 - 0.15 * smoothstep(0.6, 1.0, shape);
    smoke = mix(uColor, uCore, clamp(facing * shade * deep, 0.0, 1.0));
  }

  // 근처 연기를 분출 색으로 살짝 물들이고, 빛무리는 연기 뒤에, 심지는 맨 위에 얹는다(캔버스는 premultiplied alpha)
  vec3 tinted = mix(smoke, uJetColor, clamp(0.8 * haloSum, 0.0, 0.5));
  float cover = shape * uFade;
  float glowAlpha = clamp(haloSum, 0.0, 0.85);
  vec3 rgb = tinted * cover + uJetColor * glowAlpha * (1.0 - cover);
  float alpha = cover + glowAlpha * (1.0 - cover);
  float wickAlpha = clamp(wickSum, 0.0, 1.0);
  vec3 wickRgb = mix(uJetColor, uCore, clamp(wickCore / max(wickSum, 0.001), 0.0, 1.0));
  fragValue = vec4(wickRgb * wickAlpha + rgb * (1.0 - wickAlpha), wickAlpha + alpha * (1.0 - wickAlpha));
}`;

// 수명 판정용. 밀도 격자를 16x16으로 줄여(칸당 4x4 표본) 칸의 최대 알파를 CPU가 읽게 한다.
// 평균은 쓰지 않는다. 넓은 화면에 가는 꼬리만 남았을 때 평균이 문턱 아래로 떨어져 보이는 연기를 접는다.
export const PROBE = `${HEAD}
${ALPHA}
uniform sampler2D uDensity;
void main() {
  float peak = 0.0;
  for (int i = 0; i < 4; i++) {
    for (int j = 0; j < 4; j++) {
      vec2 jitter = ((vec2(float(i), float(j)) + 0.5) / 4.0 - 0.5) / 16.0;
      peak = max(peak, smokeAlpha(texture(uDensity, vTexCoord + jitter).x));
    }
  }
  fragValue = vec4(peak, 0.0, 0.0, 1.0);
}`;
