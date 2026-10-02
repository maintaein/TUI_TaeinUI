// 그림자 토큰 정의

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  // 소비처는 Button의 weak danger 눌림 하나다. 그 배경이 호버와 같은 error[100]이라
  // 눌린 깊이를 이 그림자가 혼자 나른다. 6%는 #FFCDD2 위에서 안 보여 0.14로 올렸다.
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.14)',
} as const;
