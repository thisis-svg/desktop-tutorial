/** 数値を「¥1,234,567」形式に整形する。 */
export function yen(n: number): string {
  return '¥' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** 「1,234,567」形式（記号なし）。 */
export function num(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
