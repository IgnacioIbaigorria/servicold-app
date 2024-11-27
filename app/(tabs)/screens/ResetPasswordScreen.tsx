// ResetPasswordScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from './types';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from './ThemeProvider';


const ResetPasswordScreen: React.FC = () => {
    const route = useRoute();
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const { token } = route.params as { token: string }; // Obtener el token del parámetro
    const { theme } = useTheme();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleResetPassword = async () => {
        if (!newPassword || !confirmPassword) {
            Alert.alert('Error', 'Por favor, completa todos los campos.');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Las contraseñas no coinciden.');
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch('https://servicoldingenieria.com/back-end/updatePassword.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({ token, newPassword }).toString(),
            });
            const text = await response.text(); // Cambiar a text() en lugar de json()
            console.log('Respuesta de la API (texto):', text);
    
            const result = JSON.parse(text); // Intenta parsear manualmente el texto a JSON

            if (response.ok && result.success) {
                Alert.alert('Éxito', 'Contraseña restablecida con éxito.');
                navigation.navigate('Login');
            } else {
                Alert.alert('Error', result.error || 'Error al restablecer la contraseña.');
            }
        } catch (error) {
            Alert.alert('Error', 'Error al restablecer la contraseña.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <LinearGradient colors={theme.colors.backgroundGradient} style={styles.gradient}>
            <View style={styles.container}>
                <Text style={styles.title}>Restablece tu Contraseña</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Nueva Contraseña"
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Confirmar Contraseña"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                />
                {isLoading ? (
                    <ActivityIndicator size="large" color="#0000ff" />
                ) : (
                    <Button title="Restablecer Contraseña" onPress={handleResetPassword} />
                )}
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradient: {
        flex:1,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 16,
    },
    title: {
        fontSize: 24,
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
});

export default ResetPasswordScreen;
