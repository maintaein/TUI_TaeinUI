/**
 * 쪼개는 단위는 자소군(grapheme)이다. 코드포인트로 쪼개면 조합용 자모로 쓴 한글(NFD)과
 * ZWJ 이모지, 결합 부호가 칸마다 갈려 깨진다. 한글은 앞서 NFC로 합쳐 음절 하나가 된다.
 */
// 저장소의 lib 대상(ES2020)에는 Intl.Segmenter 타입이 없어 필요한 모양만 적는다.
// ponytail: Segmenter가 없는 환경(Firefox 124 이하)은 코드포인트로 쪼개 NFD·ZWJ가 갈린다, 지원 하한을 올릴 때 지운다.
interface GraphemeSegmenter {
  segment(input: string): Iterable<{ segment: string }>;
}
const Segmenter = (
  Intl as unknown as {
    Segmenter?: new (
      locale?: string,
      options?: { granularity: 'grapheme' }
    ) => GraphemeSegmenter;
  }
).Segmenter;
const segmenter =
  Segmenter && new Segmenter(undefined, { granularity: 'grapheme' });
const graphemes = (word: string): string[] =>
  segmenter
    ? Array.from(segmenter.segment(word), (part) => part.segment)
    : [...word];

/**
 * 글자 효과 컴포넌트(HangulAssemble, BrushText)가 문장을 글자 칸으로 나누는 공통 규칙.
 * 낱말(공백이 아닌 덩어리)은 자소군 배열, 공백은 문자열 그대로 돌려준다.
 */
export const segmentText = (text: string): Array<string | string[]> =>
  text
    .normalize('NFC')
    .split(/(\s+)/)
    .flatMap<string | string[]>((part, i) =>
      i % 2 === 1 ? [part] : part ? [graphemes(part)] : []
    );
