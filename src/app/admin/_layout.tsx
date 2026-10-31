import { Shell, type NavItem } from '@/components/Shell';

const items: NavItem[] = [
  { name: 'index', href: '/admin', label: 'Dashboard', icon: 'home-outline' },
  { name: 'orders', href: '/admin/orders', label: 'Orders', icon: 'clipboard-outline' },
  { name: 'invoices', href: '/admin/invoices', label: 'Invoices', icon: 'receipt-outline' },
  { name: 'products', href: '/admin/products', label: 'Stock', icon: 'cube-outline' },
  { name: 'production', href: '/admin/production', label: 'Production', icon: 'construct-outline' },
  { name: 'customers', href: '/admin/customers', label: 'Customers', icon: 'people-outline' },
  { name: 'workers', href: '/admin/workers', label: 'Workers', icon: 'id-card-outline' },
];

export default function AdminLayout() {
  return <Shell items={items} title="Admin" extra={[{ name: 'settings', href: '/settings', label: 'Settings', icon: 'settings-outline' }]} />;
}
