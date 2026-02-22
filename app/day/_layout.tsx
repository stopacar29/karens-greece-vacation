import { Stack } from 'expo-router';

export default function DayLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#1a4d6d' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="[date]" options={{ title: 'Day' }} />
    </Stack>
  );
}
