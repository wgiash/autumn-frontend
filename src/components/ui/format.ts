export const money = (n: number) => "$" + n.toLocaleString("en-US");

export const money2 = (n: number) =>
  "$" +
  n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
