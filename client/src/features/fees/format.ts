/** Formats a whole-unit money amount with thousands separators. */
export const formatAmount = (value: number): string =>
  new Intl.NumberFormat('en-US').format(value);
