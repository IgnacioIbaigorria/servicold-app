import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, Alert, Modal, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from './ThemeProvider'; // Asumiendo que ya tienes el theme provider configurado
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../AuthContext';

const SettingsScreen: React.FC = () => {
    const { theme } = useTheme();
    const [globalNotificationsMuted, setGlobalNotificationsMuted] = useState(false);
    const [isModalVisible, setModalVisible] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { userData } = useAuth(); // Obtener los datos del usuario desde AuthContext


    useEffect(() => {
        const loadSettings = async () => {
            try {
                const fcmToken = await AsyncStorage.getItem('fcmToken');  // Obtener el token FCM
                if (!fcmToken) {
                    console.error('No se pudo obtener el token FCM.');
                    return;
                }
        
                // Hacer una solicitud al backend para obtener el estado de las notificaciones globales
                const response = await fetch('http://servicoldingenieria.com/back-end/get_global_notifications.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `usuario_id=${userData.userId}&token=${fcmToken}`  // Enviar el usuario y token FCM
                });
        
                const data = await response.json();
                if (data.success) {
                    const muteado = data.muteado === 1;  // Convertir a booleano
                    setGlobalNotificationsMuted(muteado);  // Actualizar el estado en la interfaz
                    await AsyncStorage.setItem('globalNotificationsMuted', JSON.stringify(muteado));  // Almacenar el valor en AsyncStorage
                } else {
                    console.error('Error al obtener el estado de notificaciones globales:', data.message);
                }
            } catch (error) {
                console.error('Error loading global notification settings from DB:', error);
            }
        };
        loadSettings();
    }, []);

    const toggleGlobalNotifications = async () => {
        const newMutedState = !globalNotificationsMuted;
        setGlobalNotificationsMuted(newMutedState);
        
        try {

            const fcmToken = await AsyncStorage.getItem('fcmToken');  // Obtener el token FCM
            if (!fcmToken) {
                console.error('No se pudo obtener el token FCM.');
                return;
            }

            await AsyncStorage.setItem('globalNotificationsMuted', JSON.stringify(newMutedState));
            Alert.alert(
                'Notificaciones globales', 
                newMutedState ? 'Se han silenciado todas las notificaciones de la aplicación.' : 'Se han activado todas las notificaciones de la aplicación.'
            );
            
            const muteado = newMutedState;
            const userId = userData.userId; // Asegúrate de que userData está definido y contiene userId
            
            
            // Enviar la solicitud al backend para mutear globalmente
            const response = await fetch('http://servicoldingenieria.com/back-end/mute_global_notifications.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `muteado=${muteado}&usuario_id=${userId}&pushToken=${fcmToken}`
            });
            
            console.log(newMutedState);
            const data = await response.json();
            console.log(data);
            
            if (!data.success) {
                console.error('Error al actualizar el estado de notificaciones globales:', data.message);
            }
        } catch (error) {
            console.error('Error saving settings', error);
        }
    };
            
    const handlePasswordChange = async () => {
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Las contraseñas no coinciden. Por favor, inténtalo de nuevo.');
            return;
        }
    
        if (newPassword.length < 6) {
            Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
            return;
        }
    
        setLoading(true);
    
        try {
            const formData = new URLSearchParams();
            formData.append('nueva_contrasena', newPassword);
    
            const response = await fetch('https://servicoldingenieria.com/back-end/cambiar_contrasena.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString(),
                credentials: 'include',
            });
    
            const result = await response.json();
    
            if (result.success) {
                Alert.alert('Éxito', 'La contraseña ha sido cambiada con éxito.');
            } else {
                Alert.alert('Error', result.error || 'Hubo un problema al cambiar la contraseña.');
            }
    
        } catch (error) {
            console.error('Error al cambiar la contraseña:', error);
            Alert.alert('Error', 'No se pudo cambiar la contraseña. Inténtalo más tarde.');
        }
    
        setLoading(false);
        setNewPassword('');
        setConfirmPassword('');
        setModalVisible(false);
    };

        return (
        <LinearGradient colors={theme.colors.backgroundGradient} style={styles.gradient}>
            <View style={styles.container}>
                <Text style={[styles.title, { color: theme.colors.text }]}>Configuración de Notificaciones</Text>
                <View style={styles.switchContainer}>
                    <Text style={[styles.sectionText, { color: theme.colors.text }]}>Silenciar todas las notificaciones</Text>
                    <Switch value={globalNotificationsMuted} onValueChange={toggleGlobalNotifications} />
                </View>

                {/* Sección de Cuenta */}
                <Text style={[styles.title, { color: theme.colors.text }]}>Cuenta</Text>
                <TouchableOpacity style={styles.changePasswordButton} onPress={() => setModalVisible(true)}>
                    <Text style={[styles.sectionText, { color: theme.colors.text }]}>Cambiar Contraseña</Text>
                </TouchableOpacity>

                <Modal
                    visible={isModalVisible}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setModalVisible(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Cambiar Contraseña</Text>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Nueva contraseña"
                                secureTextEntry
                                value={newPassword}
                                onChangeText={setNewPassword}
                            />
                            <TextInput
                                style={styles.textInput}
                                placeholder="Confirmar contraseña"
                                secureTextEntry
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                            />
                            {loading ? (
                                <ActivityIndicator size="large" color={theme.colors.primary} />
                            ) : (
                                <>
                                    <TouchableOpacity style={styles.saveButton} onPress={handlePasswordChange}>
                                        <Text style={styles.modalButtonText}>Guardar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                                        <Text style={styles.modalButtonText}>Cancelar</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>
                </Modal>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradient: { flex: 1 },
    container: { padding: 20, justifyContent: 'center' },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 0, marginTop: 15 },
    switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    changePasswordButton: { paddingVertical: 10 },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        width: '80%',
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 10,
        alignItems: 'center',
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
    textInput: {
        width: '100%',
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginBottom: 20,
    },
    saveButton: {
        backgroundColor: 'green',
        paddingVertical: 10,
        paddingHorizontal: 22,
        borderRadius: 10,
        marginBottom: 15,
    },
    cancelButton: {
        backgroundColor: 'red',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginBottom: 10,
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
    },
    sectionText: {
        fontSize: 16,
    },
});

export default SettingsScreen;
