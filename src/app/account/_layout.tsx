import { Stack } from 'expo-router';
import { CustomerNav } from '@/components/CustomerNav';
import { colors } from '@/components/ui';
import { CartProvider } from '@/lib/cart';

/** Customer pages look like a shopping website: the same top navigation on every page. */
export default function AccountLayout() {
  return (
    <CartProvider>
      <Stack screenOptions={{ header: () => <CustomerNav />, contentStyle: { backgroundColor: colors.bg }, animation: 'none' }}>
        <Stack.Screen name="index" options={{ title: 'Products' }} />
        <Stack.Screen name="cart" options={{ title: 'Cart' }} />
        <Stack.Screen name="orders/index" options={{ title: 'My orders' }} />
        <Stack.Screen name="purchases" options={{ title: 'Purchases' }} />
        <Stack.Screen name="bills/index" options={{ title: 'Bills' }} />
        <Stack.Screen name="payments" options={{ title: 'Payments' }} />
        <Stack.Screen name="profile" options={{ title: 'Profile' }} />
      </Stack>
    </CartProvider>
  );
}
