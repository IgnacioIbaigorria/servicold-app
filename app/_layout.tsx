// app/_layout.tsx
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { ThemeProvider } from './(tabs)/screens/ThemeProvider';
import { AuthProvider } from './(tabs)/AuthContext';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

export default function RootLayout() {
  
  // Solicitar permisos de notificaciones al cargar la aplicación
  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }
    };

    requestPermissions();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <PaperProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />  {/* Layout para tabs */}
          </Stack>
        </PaperProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
