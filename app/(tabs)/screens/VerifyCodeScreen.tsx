// VerifyCodeScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from './types';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from './ThemeProvider';

const VerifyCodeScreen: React.FC = () => {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const { theme } = useTheme();

    const handleVerifyCode = async () => {
        if (!code) {
            Alert.alert('Error', 'Por favor, ingresa el código de verificación.');
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch('https://servicoldingenieria.com/back-end/verificarCodigo.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({ code }).toString(),
            });
            const text = await response.text(); // Cambiar a text() en lugar de json()
            console.log('Respuesta de la API (texto):', text);
    
            const result = JSON.parse(text); // Intenta parsear manualmente el texto a JSON
            if (response.ok && result.success) {
                navigation.navigate('ResetPassword', { token: result.token });
            } else {
                Alert.alert('Error', result.error || 'Código incorrecto.');
            }
        } catch (error) {
            Alert.alert('Error', 'Error al verificar el código.');
            console.log('Error de la API:', error);
        } finally {
            setIsLoading(false);
        }
    };
            
    return (
        <LinearGradient colors={theme.colors.backgroundGradient} style={styles.gradient}>

            <View style={styles.container}>
                <Text style={styles.title}>Verifica tu código</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Código de 6 dígitos"
                    value={code}
                    onChangeText={setCode}
                    keyboardType="numeric"
                />
                {isLoading ? (
                    <ActivityIndicator size="large" color="#0000ff" />
                ) : (
                    <Button title="Verificar Código" onPress={handleVerifyCode} />
                )}
            </View>
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
        textAlign: 'center',
    },
});

export default VerifyCodeScreen;
