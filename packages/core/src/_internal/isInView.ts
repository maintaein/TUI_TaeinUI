/** 요소가 지금 화면 세로 범위에 걸쳐 있는가 */
export const isInView = (el: HTMLElement): boolean => {
  const rect = el.getBoundingClientRect();
  return rect.top < window.innerHeight && rect.bottom >= 0;
};
