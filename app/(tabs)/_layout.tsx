import { Tabs } from 'expo-router';
import { Colors } from '@/constants/Theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: { backgroundColor: Colors.cream },
        headerStyle: { backgroundColor: Colors.sea },
        headerTintColor: Colors.white,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarLabel: 'Schedule',
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="travel"
        options={{
          title: 'Travel',
          tabBarLabel: 'Travel',
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="guests"
        options={{
          title: 'Guests',
          tabBarLabel: 'Guests',
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="import"
        options={{
          title: 'Import PDF',
          tabBarLabel: 'Import',
          tabBarIcon: () => null,
        }}
      />
    </Tabs>
  );
}
