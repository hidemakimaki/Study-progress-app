import { useState } from 'react';

const QUOTES = [
  '人は自ら掴んだ本質しか、腹に落ちんのだ',
  'その努力の先に神が宿るから',
  '「審判の誤審」に惑わされてしまった',
  '少しの違いに歴戦の違いが宿る',
  '不正解は無意味を意味しない。',
];

function pickRandom(): string {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

/** クリックするとランダムに名言が切り替わる（研究タイマーのRandomWordを移植）。 */
function RandomQuote() {
  const [quote, setQuote] = useState(pickRandom);

  const shuffle = () => setQuote(pickRandom());

  return (
    <p className="random-quote" onClick={shuffle} title="クリックで切り替え">
      {quote}
    </p>
  );
}

export default RandomQuote;
