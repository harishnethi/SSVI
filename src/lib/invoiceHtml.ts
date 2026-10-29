import { amountInWords, date, money, qty } from './format';
import type { Customer, Invoice, InvoiceItem, Settings } from './types';

const esc = (s: string | null | undefined) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const nl = (s: string) => esc(s).replace(/\n/g, '<br/>');

/** Printable A4 invoice used for PDF sharing. */
export function invoiceHtml(inv: Invoice, items: InvoiceItem[], customer: Customer, s: Settings): string {
  const gst = inv.tax_mode === 'gst';
  const title = gst ? 'TAX INVOICE' : 'BILL';

  const rows = items
    .map(
      (it, i) => `<tr>
        <td>${i + 1}</td>
        <td>${esc(it.description)}</td>
        ${gst ? `<td>${esc(it.hsn)}</td>` : ''}
        <td class="r">${qty(it.qty)} ${esc(it.unit)}</td>
        <td class="r">${money(it.rate)}</td>
        ${gst ? `<td class="r">${Number(it.gst_rate)}%</td>` : ''}
        <td class="r">${money(it.amount)}</td>
      </tr>`,
    )
    .join('');

  const taxRows = gst
    ? inv.inter_state
      ? `<tr><td>IGST</td><td class="r">${money(inv.igst)}</td></tr>`
      : `<tr><td>CGST</td><td class="r">${money(inv.cgst)}</td></tr><tr><td>SGST</td><td class="r">${money(inv.sgst)}</td></tr>`
    : '';

  return `<!doctype html><html><head><meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; }
  body { font-family: Helvetica, Arial, sans-serif; color: #1b1f24; font-size: 12px; margin: 28px; }
  h1 { font-size: 22px; margin: 0; color: #1F4E79; }
  .title { text-align: center; font-weight: bold; font-size: 14px; letter-spacing: 2px; border: 1px solid #1F4E79; padding: 4px; margin: 14px 0; }
  .grid { display: flex; gap: 16px; }
  .grid > div { flex: 1; }
  .muted { color: #667085; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th { background: #1F4E79; color: #fff; text-align: left; padding: 6px; font-size: 11px; }
  td { padding: 6px; border-bottom: 1px solid #D9DEE5; vertical-align: top; }
  .r { text-align: right; }
  .totals { width: 45%; margin-left: auto; }
  .totals td { border: none; padding: 3px 6px; }
  .grand td { font-weight: bold; font-size: 14px; border-top: 2px solid #1F4E79; }
  .footer { margin-top: 28px; display: flex; justify-content: space-between; align-items: flex-end; }
  .sign { text-align: center; width: 200px; border-top: 1px solid #1b1f24; padding-top: 4px; }
  .cancelled { color: #C62828; font-size: 18px; font-weight: bold; text-align: center; border: 2px solid #C62828; padding: 6px; }
</style></head><body>
  <h1>${esc(s.business_name)}</h1>
  <div>${nl(s.address)}</div>
  <div class="muted">${[s.phone && 'Ph: ' + esc(s.phone), esc(s.email)].filter(Boolean).join(' · ')}</div>
  ${gst && s.gstin ? `<div><b>GSTIN:</b> ${esc(s.gstin)}${s.state ? ' · State: ' + esc(s.state) : ''}</div>` : ''}

  <div class="title">${title}</div>
  ${inv.cancelled ? '<div class="cancelled">CANCELLED</div>' : ''}

  <div class="grid">
    <div>
      <div class="muted">Bill to</div>
      <b>${esc(customer.name)}</b><br/>
      ${nl(customer.address)}${customer.state ? '<br/>State: ' + esc(customer.state) : ''}
      ${customer.phone ? '<br/>Ph: ' + esc(customer.phone) : ''}
      ${gst && customer.gstin ? '<br/><b>GSTIN:</b> ' + esc(customer.gstin) : ''}
    </div>
    <div style="text-align:right">
      <div><b>${gst ? 'Invoice' : 'Bill'} No:</b> ${esc(inv.invoice_no)}</div>
      <div><b>Date:</b> ${date(inv.invoice_date)}</div>
      ${inv.due_date ? `<div><b>Due:</b> ${date(inv.due_date)}</div>` : ''}
      ${gst ? `<div><b>Supply:</b> ${inv.inter_state ? 'Inter-state (IGST)' : 'Intra-state'}</div>` : ''}
    </div>
  </div>

  <table>
    <tr><th>#</th><th>Item</th>${gst ? '<th>HSN</th>' : ''}<th class="r">Qty</th><th class="r">Rate</th>${gst ? '<th class="r">GST</th>' : ''}<th class="r">Amount</th></tr>
    ${rows}
  </table>

  <table class="totals">
    <tr><td>${gst ? 'Taxable value' : 'Subtotal'}</td><td class="r">${money(inv.subtotal)}</td></tr>
    ${taxRows}
    ${Number(inv.round_off) !== 0 ? `<tr><td>Round off</td><td class="r">${money(inv.round_off)}</td></tr>` : ''}
    <tr class="grand"><td>Total</td><td class="r">${money(inv.total)}</td></tr>
    ${Number(inv.paid) > 0 ? `<tr><td>Paid</td><td class="r">${money(inv.paid)}</td></tr><tr><td><b>Balance</b></td><td class="r"><b>${money(Number(inv.total) - Number(inv.paid))}</b></td></tr>` : ''}
  </table>
  <p><b>Amount in words:</b> ${amountInWords(Number(inv.total))}</p>
  ${inv.notes ? `<p><b>Notes:</b> ${nl(inv.notes)}</p>` : ''}
  ${s.bank_details ? `<p><b>Bank details:</b><br/>${nl(s.bank_details)}</p>` : ''}

  <div class="footer">
    <div class="muted" style="max-width:55%">${nl(s.invoice_terms)}</div>
    <div class="sign">For ${esc(s.business_name)}<br/><br/><br/>Authorised Signatory</div>
  </div>
</body></html>`;
}
