const POSITIVE_KEYWORDS = [
  'bien',
  'genial',
  'gracias',
  'perfecto',
  'excelente',
  'feliz',
  'listo',
  'bueno',
  'sí',
  'claro',
];

const NEGATIVE_KEYWORDS = [
  'mal',
  'error',
  'problema',
  'no',
  'falla',
  'duda',
  'difícil',
  'complicado',
];

export const analyzeSentiment = (text) => {
  if (!text || typeof text !== 'string') {
    return 'neutral';
  }
  const lowerText = text.toLowerCase();
  let positiveScore = 0;
  let negativeScore = 0;

  for (const keyword of POSITIVE_KEYWORDS) {
    if (lowerText.includes(keyword)) positiveScore++;
  }
  for (const keyword of NEGATIVE_KEYWORDS) {
    if (lowerText.includes(keyword)) negativeScore++;
  }

  if (positiveScore > negativeScore) return 'positive';
  if (negativeScore > positiveScore) return 'negative';
  return 'neutral';
};
