import { Shell, type NavItem } from '@/components/Shell';

const items: NavItem[] = [
  { name: 'index', href: '/worker', label: 'Today', icon: 'today-outline' },
  { name: 'orders', href: '/worker/orders', label: 'Orders', icon: 'clipboard-outline' },
  { name: 'stock', href: '/worker/stock', label: 'Stock', icon: 'cube-outline' },
  { name: 'production', href: '/worker/production', label: 'Production', icon: 'construct-outline' },
];

export default function WorkerLayout() {
  return <Shell items={items} title="Worker" />;
}
