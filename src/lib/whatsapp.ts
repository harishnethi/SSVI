import { Linking } from 'react-native';
import { date, money, qty } from './format';
import type { Customer, Invoice, InvoiceItem, Settings } from './types';

/** Plain-text bill summary that reads well in a WhatsApp chat. */
export function billMessage(inv: Invoice, items: InvoiceItem[], customer: Customer, s: Settings) {
  const due = Math.max(0, Number(inv.total) - Number(inv.paid));
  const lines = [
    `*${s.business_name || 'Sai Venkateshwara Industries'}*`,
    `${inv.tax_mode === 'gst' ? 'Tax invoice' : 'Bill'} *${inv.invoice_no}* · ${date(inv.invoice_date)}`,
    `To: ${customer.name}`,
    '',
    ...items.map((it) => `• ${it.description} — ${qty(it.qty)} ${it.unit} × ${money(it.rate)} = ${money(it.amount)}`),
    '',
    `*Total: ${money(inv.total)}*`,
  ];
  if (Number(inv.paid) > 0) lines.push(`Paid: ${money(inv.paid)}`);
  if (inv.cancelled) lines.push('_This bill was cancelled._');
  else if (due > 0) lines.push(`*Balance due: ${money(due)}*`);
  else lines.push('Fully paid. Thank you!');
  if (s.bank_details && due > 0 && !inv.cancelled) lines.push('', `Pay to: ${s.bank_details}`);
  return lines.join('\n');
}

/** Indian 10-digit numbers get the 91 country code; returns '' when there is no usable number. */
export function waNumber(phone: string | null | undefined) {
  const d = (phone ?? '').replace(/\D/g, '');
  if (d.length === 10) return '91' + d;
  if (d.length === 12 && d.startsWith('91')) return d;
  return d.length >= 11 ? d : '';
}

/** Opens WhatsApp with the message ready to send; to a number when given, otherwise lets the person choose a chat. */
export function openWhatsApp(text: string, phone?: string) {
  const to = waNumber(phone);
  return Linking.openURL(`https://wa.me/${to}?text=${encodeURIComponent(text)}`);
}
