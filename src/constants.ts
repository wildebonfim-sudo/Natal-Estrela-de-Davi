export const calculatePrice = (type: string, days: number) => {
  if (type === 'exempt' || type === 'Isento') return 0;
  
  if (type === 'teen' || type === 'Adolescente') {
    const prices: Record<number, number> = { 1: 75, 2: 150, 3: 185, 4: 200 };
    return prices[days] || 0;
  }
  
  if (type === 'adult' || type === 'Adulto') {
    const prices: Record<number, number> = { 1: 150, 2: 300, 3: 370, 4: 400 };
    return prices[days] || 0;
  }
  
  return 0;
};
