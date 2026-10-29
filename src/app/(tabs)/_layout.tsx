import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';
import { colors } from '@/components/ui';

type IconName = ComponentProps<typeof Ionicons>['name'];

const icon = (name: IconName) =>
  function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Ionicons name={name} color={color as string} size={size} />;
  };

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: colors.primary,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', headerTitle: 'SSVI', tabBarIcon: icon('home-outline') }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders', tabBarIcon: icon('clipboard-outline') }} />
      <Tabs.Screen name="invoices" options={{ title: 'Invoices', tabBarIcon: icon('receipt-outline') }} />
      <Tabs.Screen name="products" options={{ title: 'Inventory', tabBarIcon: icon('cube-outline') }} />
      <Tabs.Screen name="customers" options={{ title: 'Customers', tabBarIcon: icon('people-outline') }} />
    </Tabs>
  );
}
