//(tabs)/_layout.tsx
import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { PaperProvider } from 'react-native-paper';
import DrawerNavigator from './DrawerNavigator';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from './screens/types';
import { AppState } from 'react-native';


const Stack = createStackNavigator();

// Configuración de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Función para monitorear los sensores
export const monitorSensors = async () => {
  console.log('Monitoreo de sensores en ejecución...');
  try {
    const sensorsString = await AsyncStorage.getItem('userSensors');
    const sensors = sensorsString ? JSON.parse(sensorsString) : [];
    console.log('Sensores encontrados:', sensorsString);

    
    if (!Array.isArray(sensors)) {
      console.error('Error: los sensores no son un array válido.');
      return;
    }

    const userId = await AsyncStorage.getItem('userId');
    if (sensors.length > 0 && userId) {
      for (let sensor of sensors) {
        await fetchSensorReading(sensor, userId);
      }
    } else {
      console.error('No se encontraron sensores o usuario no autenticado');
    }
  } catch (error) {
    console.error('Error en el monitoreo de sensores:', error);
  }
};

// Función para obtener la lectura de los sensores
export const fetchSensorReading = async (sensor: { nombre: any; tipo: string; umbral: number; umbralMax: number }, userId: string) => {
  try {
    const response = await fetch(`https://servicoldingenieria.com/back-end/ultimaLectura.php?sensor_name=${sensor.nombre}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      const result = await response.json();
      const currentTime = new Date();
      const lastReadingTime = new Date(result.fecha_actual);
      const timeDifference = (currentTime.getTime() - lastReadingTime.getTime()) / (1000 * 60); // Diferencia en minutos

      const globalNotificationsMuted = await AsyncStorage.getItem('globalNotificationsMuted') === 'true';
      const sensorMuted = await AsyncStorage.getItem(`sensorMuted_${sensor.nombre}`) === 'true';

      if (!globalNotificationsMuted && !sensorMuted) {
        if (timeDifference > 15) {
          await sendPushNotificationToBackend(userId, `El sensor *${sensor.nombre}* está fuera de línea. Última lectura: ${lastReadingTime} minutos.`);
          return;
        }

        if (sensor.tipo === 'temperatura') {
          const valor = parseFloat(result.Temperatura);
          if (valor < sensor.umbral || valor > sensor.umbralMax) {
            await sendPushNotificationToBackend(userId, `El valor del sensor *${sensor.nombre}* está fuera de los límites: ${valor}°C`);
          }
        } else if (sensor.tipo === 'combustible') {
          const valor = parseFloat(result.nivel_combustible);
          if (valor < sensor.umbral || valor > sensor.umbralMax) {
            await sendPushNotificationToBackend(userId, `El nivel del sensor *${sensor.nombre}* está fuera de los límites: ${valor}%`);
          }
        }
      }
    } else {
      console.error('Error al obtener la lectura del sensor');
    }
  } catch (error) {
    console.error('Error al obtener la lectura del sensor:', error);
  }
};

// Función para enviar notificaciones push
const sendPushNotificationToBackend = async (userId: string, message: string) => {
  try {
    const response = await fetch('https://servicoldingenieria.com/back-end/send_notification.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, message }),
    });

    const result = await response.json();
    if (response.ok) {
      console.log('Notificación push enviada:', result.message);
    } else {
      console.error('Error al enviar notificación push:', result.error);
    }
  } catch (error) {
    console.error('Error en la llamada al backend para enviar notificación push:', error);
  }
};

// Registro de la tarea en segundo plano

// Componente principal de la aplicación
export default function TabsLayout() {
  const [appState, setAppState] = useState(AppState.currentState);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();


  useEffect(() => {
    // Listener para cuando la notificación es recibida
    const notificationListener = Notifications.addNotificationReceivedListener(async (notification) => {
      const userId = await AsyncStorage.getItem('userId');
      const message = notification.request.content.body;
      await saveNotification(userId, message);
    });

    // Listener para cuando la notificación es presionada
    const notificationResponseListener = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const userId = await AsyncStorage.getItem('userId');
      
      // Obtenemos las notificaciones desde AsyncStorage
      const notificationsString = await AsyncStorage.getItem(`userNotifications_${userId}`);
      const notifications = notificationsString ? JSON.parse(notificationsString) : [];

      // Verificamos si la respuesta a la notificación es válida
      if (response && response.notification) {
        // Navegamos a la pantalla de notificaciones si la app estaba en segundo plano o inactiva
        if (appState === 'background' || appState === 'inactive') {
          navigation.navigate('Notifications', { notifications });
        } else {
          console.log('La app estaba en primer plano.');
        }
      }
    });

    // Listener para cambios de estado de la app (segundo plano/activo)
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      setAppState(nextAppState);
    });

    // Cleanup de listeners
    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(notificationResponseListener);
      subscription.remove();
    };
  }, [appState, navigation]);

  const saveNotification = async (userId: string | null, message: string | null) => {
    try {
      const userNotificationsString = await AsyncStorage.getItem(`userNotifications_${userId}`);
      let userNotifications = userNotificationsString ? JSON.parse(userNotificationsString) : [];
      const now = new Date();
      const formattedDate = now.toLocaleDateString();
      const formattedTime = now.toLocaleTimeString();
      const notificationMessage = `${message} -- ${formattedDate} ${formattedTime}`;
      userNotifications.push(notificationMessage);
      await AsyncStorage.setItem(`userNotifications_${userId}`, JSON.stringify(userNotifications));
    } catch (error) {
      console.error('Error al guardar la notificación:', error);
    }
  };

  return (
    <PaperProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="drawer" component={DrawerNavigator} />
      </Stack.Navigator>
    </PaperProvider>
  );
}
