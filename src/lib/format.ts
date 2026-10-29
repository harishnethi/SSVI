import type { LineItem, TaxMode } from './types';

export function money(n: number | string | null | undefined): string {
  const v = Number(n ?? 0);
  return '₹' + v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function qty(n: number | string): string {
  const v = Number(n);
  return Number.isInteger(v) ? String(v) : v.toFixed(3).replace(/0+$/, '');
}

export function today(): string {
  const d = new Date();
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function date(s: string | null | undefined): string {
  if (!s) return '';
  const [y, m, d] = s.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Mirrors the create_invoice() SQL function so the form preview matches the saved invoice. */
export function computeTotals(items: LineItem[], mode: TaxMode, interState: boolean) {
  let subtotal = 0;
  let tax = 0;
  for (const it of items) {
    const amount = round2(it.qty * it.rate);
    subtotal += amount;
    if (mode === 'gst') tax += round2((amount * it.gst_rate) / 100);
  }
  subtotal = round2(subtotal);
  tax = round2(tax);
  const half = round2(tax / 2);
  const gross = subtotal + tax;
  const total = Math.round(gross);
  return {
    subtotal,
    cgst: interState ? 0 : half,
    sgst: interState ? 0 : round2(tax - half),
    igst: interState ? tax : 0,
    roundOff: round2(total - gross),
    total,
  };
}

/** Indian-style amount in words, e.g. "Rupees One Lakh Twenty Thousand Only". */
export function amountInWords(n: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven',
    'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const two = (x: number) => (x < 20 ? ones[x] : tens[Math.floor(x / 10)] + (x % 10 ? ' ' + ones[x % 10] : ''));
  const three = (x: number) =>
    (x >= 100 ? ones[Math.floor(x / 100)] + ' Hundred' + (x % 100 ? ' ' : '') : '') + two(x % 100);

  let rupees = Math.floor(Math.abs(n));
  const paise = Math.round((Math.abs(n) - rupees) * 100);
  if (rupees === 0 && paise === 0) return 'Rupees Zero Only';

  const parts: string[] = [];
  const crore = Math.floor(rupees / 10000000); rupees %= 10000000;
  const lakh = Math.floor(rupees / 100000); rupees %= 100000;
  const thousand = Math.floor(rupees / 1000); rupees %= 1000;
  if (crore) parts.push(three(crore) + ' Crore');
  if (lakh) parts.push(two(lakh) + ' Lakh');
  if (thousand) parts.push(two(thousand) + ' Thousand');
  if (rupees) parts.push(three(rupees));

  let out = 'Rupees ' + (parts.join(' ') || 'Zero');
  if (paise) out += ' and ' + two(paise) + ' Paise';
  return out + ' Only';
}
