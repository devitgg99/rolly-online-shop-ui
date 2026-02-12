/** Fixed exchange rate: 1 USD = 4,000 KHR */
const KHR_RATE = 4000;

/** Convert USD amount to KHR (rounded) */
export const toKHR = (usd: number) => Math.round(usd * KHR_RATE);

/** Format as Khmer Riel: "12,000៛" */
export const formatKHR = (usd: number) => `${toKHR(usd).toLocaleString()}៛`;

/** Format as US Dollar: "$3.00" */
export const formatUSD = (usd: number) => `$${usd.toFixed(2)}`;
