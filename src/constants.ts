export const calculatePrice = (type: 'adult' | 'teen' | 'exempt', days: number) => {
  if (type === 'exempt') return 0;
  
  if (type === 'teen') {
    const prices = { 1: 75, 2: 150, 3: 185, 4: 200 };
    return prices[days as keyof typeof prices] || 0;
  }
  
  if (type === 'adult') {
    const prices = { 1: 150, 2: 300, 3: 370, 4: 400 };
    return prices[days as keyof typeof prices] || 0;
  }
  
  return 0;
};
