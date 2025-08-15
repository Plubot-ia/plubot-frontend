import { useState, useEffect, useMemo } from 'react';

const usePhraseRotator = (initialPhrases, intervalTime = 4000) => {
  const [phraseIndex, setPhraseIndex] = useState(0);

  const phrasesMap = useMemo(
    () => new Map(initialPhrases.map((phrase, index) => [index, phrase])),
    [initialPhrases],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((previous) => (previous + 1) % phrasesMap.size);
    }, intervalTime);
    return () => clearInterval(interval);
  }, [phrasesMap, intervalTime]);

  const currentPhrase = phrasesMap.get(phraseIndex) ?? '';

  return {
    currentPhrase,
  };
};

export default usePhraseRotator;
