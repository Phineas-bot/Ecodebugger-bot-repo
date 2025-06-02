export interface EcoTip {
  message: string;
  et: string;
  grams: string;
}

export const ecoTips: EcoTip[] = [
  {
    message: 'This loop wastes CPU — try map()',
    et: '0.0 s',
    grams: '0.4 g',
  },
  {
    message: 'Avoid unnecessary print()/console.log() in production',
    et: '0.0 s',
    grams: '0.1 g',
  },
  {
    message: 'Use list/set comprehensions in Python for better efficiency',
    et: '0.0 s',
    grams: '0.2 g',
  },
];
