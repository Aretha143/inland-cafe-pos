// Currency formatting utilities for Nepali Rupees
export const formatCurrency = (amount: number | undefined | null): string => {
  const validAmount = amount || 0;
  return `Rs. ${validAmount.toFixed(2)}`;
};

export const formatAmount = (amount: number | undefined | null): string => {
  const validAmount = amount || 0;
  return `Rs. ${validAmount.toFixed(2)}`;
};

export const parseCurrency = (value: string): number => {
  const cleaned = value.replace(/[Rs.,\s]/g, '');
  return parseFloat(cleaned) || 0;
};
