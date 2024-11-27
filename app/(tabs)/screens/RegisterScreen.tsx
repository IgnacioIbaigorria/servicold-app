// Importaciones necesarias
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from './types';
import { useTheme} from './ThemeProvider'

const RegisterScreen: React.FC = () => {
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rol] = useState('cliente'); // Rol por defecto establecido como 'cliente'
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const { theme } = useTheme();

    const handleRegister = async () => {
        if (!nombre || !email || !password) {
            Alert.alert('Error', 'Todos los campos son obligatorios.');
            return;
        }

        try {
            const response = await fetch('https://servicoldingenieria.com/registrarUsuario.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    nombre,
                    email,
                    password_hash: password, // Asegúrate de que el nombre del campo coincida con el esperado en el backend
                    rol,
                }).toString(),
            });

            const result = await response.json();
            if (response.ok) {
                Alert.alert('Éxito', result.message);
                navigation.navigate('Login');
                // Aquí podrías redirigir al usuario a la pantalla de inicio de sesión o limpiar los campos
            } else {
                Alert.alert('Error', result.error || 'Error desconocido');
            }
        } catch (error: any) {
            Alert.alert('Error', 'Error al registrar el usuario: ' + error.message);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Registro de Usuario</Text>
            <TextInput
                style={styles.input}
                placeholder="Nombre"
                value={nombre}
                onChangeText={setNombre}
            />
            <TextInput
                style={styles.input}
                placeholder="Correo"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
            />
            <TextInput
                style={styles.input}
                placeholder="Contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.primary }]} onPress={handleRegister}>
                <Text style={styles.buttonText}>Registrarme</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
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
        borderColor: '#ccc',
        borderWidth: 1,
        marginBottom: 12,
        paddingHorizontal: 8,
    },
    button: {
        backgroundColor: '#007BFF',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default RegisterScreen;