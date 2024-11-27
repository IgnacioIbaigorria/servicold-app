import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import AdminScreen from './screens/AdminScreen';
import SensorListScreen from './screens/SensorListScreen';
import SensorDetailScreen from './screens/SensorDetailScreen';
import PermisosScreen from './screens/PermisosScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import { AuthProvider } from './AuthContext'; // Importa tu AuthProvider
import { RootStackParamList } from './screens/types';
import { useTheme } from './screens/ThemeProvider'; // Importa el hook para acceder al tema
import SettingsScreen from './screens/SettingsScreen';
import HelpScreen from './screens/HelpScreen';
import LoadingScreen from './screens/LoadingScreen';
const Stack = createStackNavigator<RootStackParamList>();

const StackNavigator = () => {
  const { theme } = useTheme(); // Accede al tema

  return (
    <AuthProvider>
      <Stack.Navigator
        initialRouteName="Loading"
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: theme.colors.background, borderBottomWidth: 3, borderBottomColor: theme.colors.text, elevation: 0, shadowOpacity: 0}, // Fondo del header
          headerTintColor: theme.colors.onBackground, // Color del texto y los íconos del header
          headerTitleStyle: { 
            color: theme.colors.text, // Color del título
            fontSize: 22, // Ajusta el tamaño del título aquí
            margin: 0, // Asegúrate de que no haya márgenes
          },
          headerTitleAlign: 'center',
            }}
      >
        <Stack.Screen name="Loading" component={LoadingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Inicio' }} />
        <Stack.Screen name="Admin" component={AdminScreen} options={{ title: 'Administración' }} />
        <Stack.Screen name="SensorList" component={SensorListScreen} options={{ title: 'Lista de sensores' }} />
        <Stack.Screen name="SensorDetail" component={SensorDetailScreen} options={{ title: 'Detalle de Sensor' }} />
        <Stack.Screen name="Permisos" component={PermisosScreen} options={{ title: 'Permisos' }} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notificaciones' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Ajustes' }} />
        <Stack.Screen name="Ayuda" component={HelpScreen} options={{ title: 'Ayuda' }} />
      </Stack.Navigator>
    </AuthProvider>
  );
};

export default StackNavigator;


