/** 분해한 자모 조각. 호환용 자모(U+3131~U+318E)다. 겹받침·겹모음은 한 조각이다 */
export interface HangulJamo {
  initial: string;
  medial: string;
  /** 받침이 없으면 없다 */
  final?: string;
}

// 조합용 자모(U+1100대)는 홀로 그리면 깨진다. 표시용이라 처음부터 호환용 자모로 둔다.
const INITIALS = [...'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'];
const MEDIALS = [...'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'];
// 0번은 받침 없음
const FINALS = [
  '',
  ...'ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ',
];

const SYLLABLE_START = 0xac00;
const SYLLABLE_END = 0xd7a3;

/** 음절 = 0xAC00 + (초성 * 21 + 중성) * 28 + 종성. 음절이 아니면 null */
export const decomposeHangul = (char: string): HangulJamo | null => {
  const code = char.codePointAt(0);
  if (code === undefined || code < SYLLABLE_START || code > SYLLABLE_END) {
    return null;
  }
  const offset = code - SYLLABLE_START;
  const final = FINALS[offset % 28];
  const medialIndex = Math.floor(offset / 28) % 21;
  const initialIndex = Math.floor(offset / 28 / 21);
  return {
    initial: INITIALS[initialIndex],
    medial: MEDIALS[medialIndex],
    ...(final ? { final } : {}),
  };
};
