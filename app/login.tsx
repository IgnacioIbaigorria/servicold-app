// app/login.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from './(tabs)/screens/ThemeProvider';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { theme } = useTheme(); // Obtén el tema del contexto
    const router = useRouter(); // Usa el router para navegar

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Todos los campos son obligatorios.');
            return;
        }

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

            if (response.ok) {
                Alert.alert('Éxito', result.mensaje);
                router.replace('/(tabs)/screens/HomeScreen'); // Navegar a Home después del login
            } else {
                Alert.alert('Error', result.error);
            }
        } catch (error) {
            Alert.alert('Error', 'Error al iniciar sesión');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.title, { color: theme.colors.onBackground }]}>Login</Text>
            <TextInput
                style={[styles.input, { borderColor: theme.colors.border }]}
                placeholder="Correo"
                value={email}
                onChangeText={setEmail}
                placeholderTextColor={theme.colors.onBackground}
            />
            <TextInput
                style={[styles.input, { borderColor: theme.colors.border }]}
                placeholder="Contraseña"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                placeholderTextColor={theme.colors.onBackground}
            />
            <Button title="Iniciar sesión" onPress={handleLogin} color={theme.colors.primary} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 16,
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
});
