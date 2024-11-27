// Login.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useTheme } from './ThemeProvider';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from './types';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';



const LoginScreen: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false); // Modal visibility state
    const [resetEmail, setResetEmail] = useState(''); // Email for password reset
    const { theme } = useTheme();
    const { login } = useAuth();
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();


    useEffect(() => {
        const checkSession = async () => {
            try {
                const userSession = await AsyncStorage.getItem('userSession');
                const rol = await AsyncStorage.getItem('userRole');
                if (userSession) {
                    if (rol === 'cliente') {
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'SensorList' }],
                        });
                    } else if (rol === 'admin') {
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Home' }], 
                        });
                    }
                }
            } catch (error) {
                console.error('Error al verificar la sesión:', error);
            } finally {
                setIsLoading(false);
            }
        };
        checkSession();
    }, [navigation]);
    
    const registerForPushNotificationsAsync = async (userId: string | null) => {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
            const { status: newStatus } = await Notifications.requestPermissionsAsync();
            if (newStatus !== 'granted') {
                console.warn('No se otorgaron permisos de notificación');
                Alert.alert('Alerta', 'No se otorgaron permisos de notificaciones');
                return;
            }
        }
    
        let token;
        if (Platform.OS === 'android' || Platform.OS === 'ios') {
            const { data } = await Notifications.getDevicePushTokenAsync();
            token = data;
        }
        
        console.log(token);
        
        if (token) {
            // Guardar el token en AsyncStorage
            await AsyncStorage.setItem('fcmToken', token);  // Guardar el token FCM
    
            await fetch('https://servicoldingenieria.com/back-end/register_push_token.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, token }),
            });
        } else {
            console.error("No se pudo obtener el token de notificación.");
        }
    };
        
    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Todos los campos son obligatorios.');
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch('https://servicoldingenieria.com/back-end/login.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    email,
                    password,
                }).toString(),
            });
            const result = await response.json();
            if (response.ok && result.token) {
                await AsyncStorage.setItem('userSession', JSON.stringify(result));
                await AsyncStorage.setItem('userRole', result.rol); // Guardar rol del usuario
                await registerForPushNotificationsAsync(result.userId);
                const rol = result.rol;
                login(result);
                // Redirigir según el rol
                if (rol === 'admin') {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Home' }],
                    });
                } else if (rol === 'cliente') {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'SensorList' }],
                    });
                }
            } else {
                Alert.alert('Error', result.error || 'Error desconocido');
            }
        } catch (error: any) {
            Alert.alert('Error', 'Error al iniciar sesión: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Handle password reset
    const handlePasswordReset = async () => {
      if (!resetEmail) {
          Alert.alert('Error', 'Por favor, ingrese su correo electrónico.');
          return;
      }
      setIsLoading(true);
      try {
          const response = await fetch('https://servicoldingenieria.com/back-end/reset-password.php', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({ email: resetEmail }).toString(),
          });
          const result = await response.json();
          if (response.ok && result.success) {
              Alert.alert('Éxito', 'Se ha enviado un correo con el código de verificación.');
              setModalVisible(false);
              navigation.navigate('VerifyCode'); // Navega a la pantalla de verificación del código
          } else {
              Alert.alert('Error', result.error || 'Error al solicitar el restablecimiento de la contraseña.');
          }
      } catch (error) {
          Alert.alert('Error', 'Error al solicitar el restablecimiento de la contraseña.');
      } finally {
          setIsLoading(false);
      }
  };
  if (isLoading) {
    return (
        <LinearGradient colors={theme.colors.backgroundGradient} style={styles.gradient}>
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        </LinearGradient>
    );
}

    
    return (
        <LinearGradient colors={theme.colors.backgroundGradient} style={styles.gradient}>
            <View style={styles.container}>
                <Text style={[styles.title, { color: theme.colors.text }]}>Inicio de sesión</Text>
                <TextInput
                    style={[styles.input, { color: theme.colors.text }]}
                    placeholder="Correo"
                    value={email}
                    onChangeText={setEmail}
                    placeholderTextColor={theme.colors.text}
                    keyboardType="email-address"
                />
                <TextInput
                    style={[styles.input, { color: theme.colors.text }]}
                    placeholder="Contraseña"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    placeholderTextColor={theme.colors.text}
                    keyboardType="default"
                />
                {isLoading ? (
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                ) : (
                    <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.primary }]} onPress={handleLogin}>
                    <Text style={styles.buttonText}>Iniciar sesión</Text>
                </TouchableOpacity>
                     )}
                <TouchableOpacity onPress={() => navigation.navigate('Registro')}>
                    <Text style={[styles.registerText, { color: theme.colors.text }]}>
                        ¿No tienes cuenta? Regístrate aquí
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setModalVisible(true)}>
                    <Text style={[styles.forgotPassword, { color: theme.colors.text }]}>
                        ¿Olvidaste tu contraseña?
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Modal for password reset */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Restablecer contraseña</Text>
                        <TextInput
                            style={styles.passInput}
                            placeholder="Ingresa tu correo"
                            value={resetEmail}
                            onChangeText={setResetEmail}
                        />
                        <TouchableOpacity
                                style={[styles.modalItem, { backgroundColor: '#30af06' }]}
                                onPress={handlePasswordReset}
                                >
                                <Text style={{ color: 'fff' }}>Enviar correo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                                style={[styles.modalItem, { backgroundColor: '#da0505' }]}
                                onPress={() => {setModalVisible(false)}}
                            >
                                <Text style={{ color: 'fff' }}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 16,
    },
    loadingContainer: {
        flex: 1, // Ocupar todo el espacio disponible
        justifyContent: 'center', // Centrar verticalmente
        alignItems: 'center', // Centrar horizontalmente
        height: '100%', // Ocupar toda la altura de la pantalla
      },    
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        height: 40,
        borderWidth: 1,
        marginBottom: 12,
        paddingHorizontal: 8,
    },
    passInput:{
      height: 40,
      borderWidth: 1,
      marginBottom: 12,
      paddingHorizontal: 8,
      width: '90%',
    },
    forgotPassword: {
        marginTop: 10,
        textAlign: 'center',
        fontSize: 16,
        textDecorationLine: 'underline',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: 300,
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 10,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        marginBottom: 10,
        fontWeight: 'bold',
    },
    modalItem:{
      padding: 10,
      borderRadius: 10,
      margin: 5,
      fontWeight: 'bold',
      width: '50%',
      textAlign: 'center',
      alignItems: 'center',
    },
    registerText: {
        marginTop: 20,
        marginBottom: 10,
        textAlign: 'center',
        fontSize: 16,
        textDecorationLine: 'underline',
    },
    button: {
        padding: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    }, 
});

export default LoginScreen;
