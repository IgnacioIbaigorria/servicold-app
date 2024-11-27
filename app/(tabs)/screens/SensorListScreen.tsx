import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, BackHandler } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native'; 
import { StackNavigationProp } from '@react-navigation/stack'; 
import { RootStackParamList } from './types'; 
import { useTheme } from './ThemeProvider'; 
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Importa los iconos
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../AuthContext'; // Importa el contexto de autenticación


type SensorListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SensorList'>;

interface Sensor {
    id: number;
    nombre: string;
    tipo: string; // Puede ser 'combustible' o 'temperatura'
}

interface SensorReading {
    Temperatura?: string;
    nivel_combustible?: string;
    fecha_actual: string;
}

const SensorListScreen: React.FC = () => {
    const [sensors, setSensors] = useState<Sensor[]>([]);
    const [sensorReadings, setSensorReadings] = useState<{ [key: string]: SensorReading }>({});
    const [loadingSensors, setLoadingSensors] = useState(true); // Estado de carga para sensores
    const [loadingReadings, setLoadingReadings] = useState(true); // Estado de carga para lecturas
    const navigation = useNavigation<SensorListScreenNavigationProp>(); 
    const { theme } = useTheme(); 
    const { userData } = useAuth(); // Obtener información del usuario
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [noSensorsMessage, setNoSensorsMessage] = useState(false);

    const isAdmin = userData?.rol === 'admin'; // Asegúrate de que esta lógica se ajuste a tu modelo de datos


    const onRefresh = async () => {
        await fetchSensors();
    };

    const fetchSensors = async () => {
        try {
            setLoadingSensors(true);
            setLoadingReadings(true);
            const response = await fetch('https://servicoldingenieria.com/back-end/sensoresUsuario.php', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });

            if (response.ok) {
                const result = await response.json();

                if (Array.isArray(result) && result.length === 0) {
                    console.log('No hay sensores disponibles');
                    setNoSensorsMessage(true);
                } else if (Array.isArray(result)) {
                    setSensors(result);
                    setNoSensorsMessage(false);

                    Promise.all(result.map((sensor: Sensor) => fetchSensorReading(sensor)))
                        .then(() => setLoadingReadings(false));
                } else if (result.message) {
                    setLoadingReadings(false);
                    setLoadingSensors(false);
                    setNoSensorsMessage(true);
                } else {
                    console.error('La respuesta no es un array ni un mensaje esperado:', result);
                }
            } else {
                const error = await response.json();
                console.error('Error fetching sensors:', error);
            }
        } catch (error) {
            console.error('Error fetching sensors:', error);
        } finally {
            setLoadingSensors(false);
        }
    };

    const fetchSensorReading = async (sensor: Sensor) => {
        try {
            const response = await fetch(`https://servicoldingenieria.com/back-end/ultimaLectura.php?sensor_name=${sensor.nombre}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
            });
    
            if (response.ok) {
                const result = await response.json();
                
                if (result.error) {
                    console.error('Error fetching sensor reading:', result.error);
                } else {
                    const reading = sensor.tipo === 'temperatura'
                        ? { Temperatura: result.Temperatura, fecha_actual: result.fecha_actual }
                        : { nivel_combustible: result.nivel_combustible, fecha_actual: result.fecha_actual };
    
                    setSensorReadings(prev => ({ ...prev, [sensor.nombre]: reading }));
                }
            } else {
                console.error('Error fetching sensor reading');
            }
        } catch (error) {
            console.error('Error fetching sensor reading:', error);
        }
    };


  useEffect(() => {
      if (!isAdmin) {
          navigation.setOptions({
            headerLeft: () => null, // Eliminar el botón de retroceso si no es admin
            gestureEnabled: false, // Deshabilitar gestos de retroceso
          });
      }
      fetchSensors();
  }, [isAdmin, navigation]);

  
  useFocusEffect(
    React.useCallback(() => {
        const onBackPress = () => {
            if (!isAdmin) {
                // Si el usuario no es admin, bloquea el retroceso
                return true; // True indica que el evento está manejado y no debe seguir con la acción por defecto
            }
            return false; // False permite el comportamiento normal
        };

        // Suscribirse al evento de retroceso
        BackHandler.addEventListener('hardwareBackPress', onBackPress);

        // Limpiar el listener cuando se salga de la pantalla
        return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [isAdmin])
);



    const handleSensorPress = (sensor: Sensor) => {
        navigation.navigate('SensorDetail', { sensorName: sensor.nombre, sensorId: sensor.id });
    };

    const isSensorOnline = (fecha: string) => {
        const now = new Date();
        const lastReadingTime = new Date(fecha);
        const diffMinutes = Math.abs(now.getTime() - lastReadingTime.getTime()) / (1000 * 60);
        
        return diffMinutes <= 15;
    };

    const renderStatus = (fecha: string) => {
        return isSensorOnline(fecha)
            ? <Text style={[styles.online, { color: 'green' }]}>En línea</Text>
            : <Text style={[styles.offline, { color: '#e50404' }]}>Fuera de línea</Text>;
    };

    return (
      <LinearGradient colors={theme.colors.backgroundGradient} style={styles.gradient}>
        {loadingSensors || loadingReadings ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : noSensorsMessage ? (
          <View style={styles.noSensorsContainer}>
            <Text style={[styles.noSensorsText, {color: theme.colors.text}]}>No tienes sensores disponibles</Text>
          </View>
        ) : (
          <FlatList
            data={sensors}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => {
              const reading = sensorReadings[item.nombre];
              const online = reading && isSensorOnline(reading.fecha_actual);
      
              return (
                <TouchableOpacity onPress={() => handleSensorPress(item)}>
                  <View
                    style={[
                      styles.item,
                      {
                        borderColor: online ? theme.colors.accept : theme.colors.cancel,
                        shadowColor: online ? theme.colors.accept : theme.colors.cancel,
                        backgroundColor: theme.colors.chartBackground,
                      },
                    ]}
                  >
                    <Text style={[styles.sensorNombre, { color: theme.colors.text }]}>
                        {item.nombre}
                    </Text>
                    <View style={styles.sensorInfo}>
                      {item.tipo === 'temperatura' ? (
                        <>
                          <MaterialCommunityIcons
                            name="thermometer"
                            size={35}
                            color={theme.dark ? '#6fcfef' : 'blue'}
                          />
                          <Text style={[styles.sensorLectura, { color: theme.dark ? '#6fcfef' : 'blue' }]}>
                            {reading ? `${reading.Temperatura}°C` : '---'}
                          </Text>
                        </>
                      ) : (
                        <>
                          <MaterialCommunityIcons name="fuel" size={35} color="orange" />
                          <Text style={[styles.sensorLectura, { color: 'orange' }]}>
                            {reading ? `${reading.nivel_combustible}%` : '---'}
                          </Text>
                        </>
                      )}
                    </View>
                    {reading && (
                      <View style={{ marginTop: 5 }}>
                        <Text style={[styles.lectura, { color: theme.colors.text }]}>
                          Última lectura: {new Date(reading.fecha_actual).toLocaleString('es-ES')}
                        </Text>
                        {renderStatus(reading.fecha_actual)}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
            ListEmptyComponent={
              <Text style={{ textAlign: 'center', marginTop: 20, color: theme.colors.text }}>
                No hay sensores disponibles
              </Text>
            }
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
          />
        )}
      </LinearGradient>
    );
  };

    
const styles = StyleSheet.create({
    gradient: {
        flex: 1,
        paddingHorizontal: 25,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
    },
    noSensorsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noSensorsText: {
        fontSize: 18,
    },
    sensorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sensorNombre: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 5,
        textAlign: 'center',
        marginBottom: 10,
    },
    lectura: {
        fontWeight: '500',
    },
    sensorLectura: {
        fontSize: 25,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    item: {
        padding: 20,
        marginVertical: 10,
        borderWidth: 2.5,
        borderRadius: 15,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    separator: {
        height: 10,
    },
    online: {
        fontSize: 16,
        marginTop: 5,
        color: 'green',
    },
    offline: {
        fontSize: 16,
        marginTop: 5,
        color: '#e50404',
    },
});

export default SensorListScreen;
