import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from './types';

const LoadingScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();

    useEffect(() => {
        const checkSession = async () => {
            try {
                const userSession = await AsyncStorage.getItem('userSession');
                const rol = await AsyncStorage.getItem('userRole');

                setTimeout(() => {
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
                    } else {
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Login' }],
                        });
                    }
                }, 500); // Añade un retraso de 500ms
            } catch (error) {
                console.error('Error al verificar la sesión:', error);
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }],
                });
            }
        };

        checkSession();
    }, [navigation]);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#0000ff" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default LoadingScreen;
