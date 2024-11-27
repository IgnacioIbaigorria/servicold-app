import React, { useEffect, useInsertionEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from './ThemeProvider';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {monitorSensors} from '../_layout'

type HomeScreenNavigationProp = DrawerNavigationProp<{
  Login: undefined;
  Home: undefined;
  Admin: undefined;
  SensorList: undefined;
  SensorDetail: undefined;
  Permisos: undefined;
}>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { theme } = useTheme();
  const [rol, setRol] = useState<string | null>(null);
  const [imageWidthSize, setImageWidthSize] = useState<number>(290);
  const [imageLenghtSize, setImageLenghtSize] = useState<number>(100);
  const buttonColor = theme.colors.primary;


  useFocusEffect(
    React.useCallback(() => {
      const fetchUserRoleAndSensors = async () => {
        try {
          setRol(null);

          // Verificar si el monitoreo ya se ejecutó
          const monitoringExecuted = await AsyncStorage.getItem('monitoringExecuted');
          const storedRole = await AsyncStorage.getItem('userRole');
          const userId = await AsyncStorage.getItem('userId');
        
          if (storedRole) {
            setRol(storedRole);
          }
  
          if (monitoringExecuted !== 'true' || !storedRole) {
            // Solo si el monitoreo no se ha ejecutado, proceder
            const roleResponse = await axios.get('https://servicoldingenieria.com/back-end/getUserRole.php');
            const userRol = roleResponse.data.rol;
            setRol(userRol);
            await AsyncStorage.setItem('userRole', userRol);


            const sensorsResponse = await axios.get('https://servicoldingenieria.com/back-end/sensoresUsuario.php');
            const sensors = Array.isArray(sensorsResponse.data) ? sensorsResponse.data : [];
            if (sensors.length === 0) {
              console.warn('No se encontraron sensores, o la respuesta no es un array.');
            } else {
              console.log('Sensores obtenidos:', sensors);
            }
            await AsyncStorage.setItem('userSensors', JSON.stringify(sensors));
            const sensores = await AsyncStorage.getItem('userSensors');
            console.log('Sensores guardados en AsyncStorage:', sensores);
          
            await monitorSensors();
            
            // Marcar que el monitoreo se ha ejecutado
            await AsyncStorage.setItem('monitoringExecuted', 'true');
          }
        } catch (error) {
          console.error('Error obteniendo datos:', error);
          Alert.alert('Error', 'No se pudieron obtener los datos del usuario.');
        }  
      };
  
      fetchUserRoleAndSensors();
    }, [])
  );
  const backgroundImage = theme.dark
    ? require('../../../assets/images/logo-removebg-preview.png')
    : require('../../../assets/images/logofondoblanco.png');



  return (
    <LinearGradient colors={theme.colors.backgroundGradient} style={styles.gradient}>
      <View style={[styles.container, { marginTop: 0 }]}>
        <Image
          source={backgroundImage}
          style={[styles.image, { width: imageWidthSize, height: imageLenghtSize }, { borderColor: theme.colors.text }]}
          resizeMode="contain"
        />

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: buttonColor }]}
            onPress={() => navigation.navigate('SensorList')}
          >
            <Text style={[styles.buttonText, { color: theme.colors.buttonText }]}>Lista de Sensores</Text>
          </TouchableOpacity>
          {rol === 'admin' && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: buttonColor }]}
              onPress={() => navigation.navigate('Admin')}
            >
              <Text style={[styles.buttonText, { color: theme.colors.buttonText }]}>Administración</Text>
            </TouchableOpacity>
          )}
        </View>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    paddingTop: 50,
    marginBottom: 80, 
  },
  buttonContainer: {
    width: '80%',
  },
  button: {
    paddingVertical: 20,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default HomeScreen;
