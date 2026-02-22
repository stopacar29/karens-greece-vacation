import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TripProvider } from '@/context/TripContext';

export default function RootLayout() {
  return (
    <TripProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#1a4d6d' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="day" options={{ headerShown: false }} />
      </Stack>
    </TripProvider>
  );
}
