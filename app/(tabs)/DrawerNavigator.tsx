import React, { useEffect, useState } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import messaging from '@react-native-firebase/messaging';
import { View, Text, Switch, StyleSheet, TouchableOpacity, Image, ActivityIndicator, TextInput, Modal, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from 'react-native-elements';
import { useTheme } from './screens/ThemeProvider';
import { useAuth } from './AuthContext'; // Importa el contexto de autenticación
import LoginScreen from './screens/LoginScreen';
import StackNavigator from './StackNavigator'; 
import * as Notifications from 'expo-notifications';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import VerifyCodeScreen from './screens/VerifyCodeScreen';
import { BlurView } from 'expo-blur'; // Importa BlurView
import SensorListScreen from './screens/SensorListScreen';
import RegisterScreen from './screens/RegisterScreen';

const Drawer = createDrawerNavigator();

// Componente del contenido del cajón
function CustomDrawerContent({ navigation }: { navigation: any }) {
  const { isDarkTheme, toggleTheme, theme } = useTheme();
  const { logout, userData } = useAuth();  // Usar userData para saber si está autenticado
  const [shouldUpdate, setShouldUpdate] = useState(false); // Estado para controlar si se debe actualizar la pantalla
  const [modalVisible, setModalVisible] = useState(false);
  const [sensorCode, setSensorCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    await logout(); // Cierra la sesión tanto en el servidor como en el frontend
    navigation.navigate('Login'); // Redirige a la pantalla de inicio de sesión
  };

  const handleNavigateToSettings = () => {
    navigation.navigate('Settings'); // Asegúrate de que "Settings" esté en tu stack de navegación
  };
  const handleNavigateToHelp = () => {
    navigation.navigate('Ayuda'); // Asegúrate de que "Settings" esté en tu stack de navegación
  };

  const handleAddSensor = async () => {
    if (sensorCode.length !== 8) {
      alert('El código del sensor debe tener exactamente 8 dígitos.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://servicoldingenieria.com/back-end/actualizarPermiso.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuario_id: userData.userId,
          codigo_unico: sensorCode,
        }),
      });

      const result = await response.json();
      if (result.exito) {
        Alert.alert('Éxito', 'Sensor agregado exitosamente.');
        setShouldUpdate(true); // Marcar que se debe actualizar la pantalla
      } else {
        Alert.alert('Error', 'Error al agregar el sensor.');
      }
    } catch (error) {
      console.error('Error al agregar el sensor:', error);
      alert('Error al conectar con el servidor.');
    } finally {
      setLoading(false);
      setModalVisible(false);
      setSensorCode(''); // Limpiar el campo de entrada
    }
  };

  useEffect(() => {
    if (shouldUpdate) {
      // Navegar a la pantalla de lista de sensores
      navigation.navigate('SensorListScreen');
      setShouldUpdate(false); // Resetear el estado de actualización
      setSensorCode(''); // Limpiar el campo de entrada al actualizar
    }
  }, [shouldUpdate, navigation]);

  return (
    <LinearGradient colors={theme.colors.backgroundGradient} style={styles.gradient}>
      <View style={styles.drawerContent}>
        <Text style={[styles.title, { color: theme.colors.onBackground }]}>Opciones</Text>
        <View style={styles.switchContainer}>
          <Text style={[styles.switchLabel, { color: theme.colors.onBackground }]}>
            {isDarkTheme ? 'Modo oscuro' : 'Modo oscuro'}
          </Text>
          <Switch value={isDarkTheme} onValueChange={toggleTheme} />
        </View>
        {userData && (
          <>
            <TouchableOpacity onPress={() => { navigation.closeDrawer(); setModalVisible(true); }} style={styles.addSensorButton}>
              <Icon name="add" type="material" color="#fff" size={20} />
              <Text style={[styles.addSensorButtonText, { color: theme.colors.onBackground }]}>Agregar Sensor</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNavigateToSettings} style={styles.settingsButton}>
              <Icon name="settings" type="material" color="#fff" size={20} />
              <Text style={[styles.settingsButtonText, { color: theme.colors.onBackground }]}>Ajustes</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNavigateToHelp} style={styles.helpButton}>
              <Icon name="help" type="material" color="#fff" size={20} />
              <Text style={[styles.helpButtonText, { color: theme.colors.onBackground }]}>Ayuda</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Icon name="logout" type="material" color="#fff" size={20} />
              <Text style={[styles.logoutButtonText, { color: theme.colors.onBackground }]}>Cerrar sesión</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Modal para agregar sensor */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setModalVisible(false);
          setSensorCode(''); // Limpiar el campo de entrada al cerrar el modal
        }}
      >
        <View style={StyleSheet.absoluteFill}>
          <BlurView intensity={150} style={StyleSheet.absoluteFill} />
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Ingrese el código del sensor</Text>
            <TextInput
              style={styles.input}
              value={sensorCode}
              onChangeText={setSensorCode}
              keyboardType="default"
              maxLength={12}
            />
            <TouchableOpacity onPress={handleAddSensor} style={styles.confirmButton}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmButtonText}>Confirmar</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              setModalVisible(false);
              setSensorCode(''); // Limpiar el campo de entrada al cancelar
            }} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

// Componente principal del navegador de cajón
function DrawerNavigator({ navigation }: { navigation: any }) {
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState<string[]>([]);
  const { userData } = useAuth();  // Obtener información del usuario autenticado
  const [unreadCount, setUnreadCount] = useState(0);  // Estado para contar notificaciones no leídas

  const fetchUnreadNotifications = async () => {
    try {
      if (userData) { // Asegúrate de que userData está disponible
        const response = await fetch(`https://servicoldingenieria.com/back-end/unread_notifications.php?user_id=${userData.userId}`);
        const data = await response.json();
        setUnreadCount(data.unread_count || 0); // Actualiza el contador con las no leídas
        const notificaciones = data.unread_count;
        console.log("Notificaciones:", notificaciones);
      }
    } catch (error) {
      console.error('Error al obtener notificaciones no leídas:', error);
    }
  };

  useEffect(() => {
    // Este useEffect se ejecutará siempre que userData cambie, es decir, cuando el usuario inicie sesión
    if (userData) {
      fetchUnreadNotifications(); // Cargar las notificaciones no leídas
    }
  }, [userData]); // Dependencia de userData, cuando cambie, se ejecuta el fetch

  useEffect(() => {

    // Listener para nuevas notificaciones locales (este es un ejemplo, puedes adaptarlo a tu lógica)
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      const { title, body, data } = notification.request.content; // Extraer los valores necesarios
      if (body) {
        // Mostrar la notificación si la app está en primer plano
        Notifications.presentNotificationAsync({
          title: title || "Nueva notificación", // Usar el título de la notificación, o uno por defecto
          body: body,   // Cuerpo de la notificación
          data: data,   // Datos adicionales (opcional)
        });
    
        setNotifications(prev => [...prev, body]); // Agregar el cuerpo a las notificaciones
        setUnreadCount(prev => prev + 1); // Incrementar el contador de no leídas
      }
    });
      
    const notificationResponseListener = Notifications.addNotificationResponseReceivedListener(response => {
      // Verificar que la respuesta sea válida antes de navegar
      if (response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
        // Navegar a la pantalla "Notifications" y pasar la notificación como parámetro
        navigation.navigate('Notifications', {
          notification: response.notification.request.content, // Pasar los detalles de la notificación
        });
      }
    });
  
    
    return () => {
      subscription.remove();
      notificationResponseListener.remove();
    };
  }, []);


  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ navigation }) => ({
        drawerPosition: 'right', // Establece el cajón para que se abra desde la derecha
        headerShown: true,
        headerStyle: { backgroundColor: theme.colors.primary},
        headerTintColor: theme.colors.onPrimary,
        headerTitle: () => (
          <Image
            source={require('../../assets/images/logo-removebg-preview.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        ),
        headerTitleStyle: { color: theme.colors.buttonText },
        headerLeft: () => null,
        headerRight: () => (
          <View style={styles.headerIconsContainer}>
            {/* Icono de notificaciones con contador */}
            {userData && ( // Solo mostrar el icono de notificaciones si el usuario está autenticado
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('Notifications', { notifications });
                  setUnreadCount(0);  // Resetea el contador de no leídas
                }}
                style={styles.headerIconContainer}
              >
                <Icon name="notifications" type="material" color={theme.colors.buttonText} size={24} />
                {unreadCount > 0 && (
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>{unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            {/* Icono de menú */}
            <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={styles.headerIconContainer}>
              <Icon name="menu" type="material" color={theme.colors.buttonText} size={24} />
            </TouchableOpacity>
          </View>
        ),
      })}
    >
      {/* Mostrar solo la pantalla de Login si no está autenticado */}
      {!userData ? (
        <>
          <Drawer.Screen name="Login" component={LoginScreen} options={{ title: 'Servicold App' }} />
          <Drawer.Screen name="Registro" component={RegisterScreen} options={{ title: 'Registro' }} />
          <Drawer.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: 'Restablecer contraseña' }} />
          <Drawer.Screen name="VerifyCode" component={VerifyCodeScreen} options={{ title: 'Verificar código' }} />
        </>
      ) : (
        <>
          {/* Mostrar las pantallas solo si el usuario está autenticado */}
          <Drawer.Screen name="Home" component={StackNavigator} options={{ title: 'Servicold App' }} />
          <Drawer.Screen name="SensorListScreen" component={SensorListScreen} options={{ title: 'Lista de sensores' }} />
        </>
      )}
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  drawerContent: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 30,
    marginLeft: 30,
    alignItems: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 18,
    fontWeight: 500,
  },
  headerRigth:{
    flexDirection: 'row',
  },
  badgeContainer: {
    position: 'absolute',
    right: -6,
    top: -3,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  settingsButton: {
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#2196F3', // Color azul
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    alignItems: 'center',
    marginLeft: 15,
  },
  helpButton:{
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#FF9800', // Color naranja
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    alignItems: 'center',
    marginLeft:15,

  },
  helpButtonText: { fontSize: 18, fontWeight: 500,},
  settingsButtonText: { fontSize: 18, fontWeight: 500,},
  logoutButton: {
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#F44336', // Color rojo
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    alignItems: 'center',
    marginLeft:15,
  },
  logoutButtonText: {
    fontSize: 18,
    fontWeight: 500,
  },
  headerIconsContainer: {
    flexDirection: 'row',  // Alinear en fila
    justifyContent: 'flex-end',  // Distribuir el espacio entre los iconos
    alignItems: 'center',  // Alinear verticalmente los iconos al centro
    marginRight: 15,  // Separación del borde derecho
  },
  headerIconContainer: {
    margin: 15,
  },
  logo: {
    width: 150, // Ajusta el tamaño de la imagen según sea necesario
    height: 40,
  },
  addSensorButton: {
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: 'green', // Color verde
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    alignItems: 'center',
    marginLeft:15,
  },
  addSensorButtonText: {
    fontSize: 18,
    fontWeight: 500,
  },
  modalContainer: {
    // Estilos para el modal
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -150 }, { translateY: -100 }],
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
  },
  confirmButton: {
    backgroundColor: 'green',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default DrawerNavigator;
