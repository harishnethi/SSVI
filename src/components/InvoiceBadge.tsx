import type { Invoice } from '@/lib/types';
import { Badge } from './ui';

export function InvoiceBadge({ invoice: i }: { invoice: Pick<Invoice, 'cancelled' | 'paid' | 'total'> }) {
  if (i.cancelled) return <Badge label="Cancelled" tone="neutral" />;
  if (Number(i.paid) >= Number(i.total)) return <Badge label="Paid" tone="success" />;
  if (Number(i.paid) > 0) return <Badge label="Partly paid" tone="warning" />;
  return <Badge label="Unpaid" tone="danger" />;
}
