// PermisosScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, ActivityIndicator, TouchableOpacity, Button, Alert, Modal, TouchableHighlight } from 'react-native';
import axios from 'axios';
import { useTheme } from './ThemeProvider'; // Ajusta la ruta si es necesario
import { LinearGradient } from 'expo-linear-gradient';

interface UserPermissions {
    usuario_id: string;
    usuario: string;
    sensores: string[];
}

interface Sensor {
    id: string;
    nombre: string;
}

const PermisosScreen: React.FC = () => {
    const [permissions, setPermissions] = useState<UserPermissions[]>([]);
    const [allSensors, setAllSensors] = useState<Sensor[]>([]);
    const [availableSensors, setAvailableSensors] = useState<Sensor[]>([]);
    const [selectedUserName, setSelectedUserName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const { theme } = useTheme();
    const [reloadKey, setReloadKey] = useState(0);

    const fetchPermissions = async () => {
        try {
            const response = await axios.get('https://servicoldingenieria.com/GetUserSensor.php');
            const data = response.data.map((item: any) => ({
                ...item,
                sensores: item.sensores ? item.sensores.split(',').map((sensor: string) => sensor.trim()) : [],
            }));
            setPermissions(data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setError('Error al cargar los datos');
            setLoading(false);
        }
    };
    const closeModal = () => {
        setModalVisible(false);
        setAvailableSensors([]);  // Limpia los sensores disponibles al cerrar el modal
    };
    

    const fetchSensors = async () => {
        try {
            const response = await axios.get('https://servicoldingenieria.com/GetAllSensors.php');
            setAllSensors(response.data);
        } catch (error) {
            console.error(error);
            setError('Error al cargar los sensores');
        }
    };

    useEffect(() => {
        fetchPermissions();
        fetchSensors();
    }, []);

    useEffect(() => {
        // Verificar si los permisos o los sensores disponibles cambian y se requiere una recarga
        if (permissions && availableSensors) {
            setReloadKey(prevKey => prevKey + 1);  // Forzar la recarga si es necesario
        }
    }, [permissions, availableSensors]);
    

    const fetchAvailableSensors = async (userName: string) => {
        try {
            const response = await axios.get(`https://servicoldingenieria.com/GetAvailableSensors.php?usuario=${userName}`);
            setAvailableSensors(response.data);
        } catch (error) {
            console.error(error);
            setError('Error al obtener sensores disponibles');
        }
    };

    const handleAddSensor = async (sensorId: string) => {
        if (selectedUserName && sensorId) {
            try {
                const userId = permissions.find(user => user.usuario === selectedUserName)?.usuario_id;
                
                if (userId) {
                    const formData = new FormData();
                    formData.append('usuario_id', userId);
                    formData.append('sensor_id', sensorId);
    
                    const response = await fetch('https://servicoldingenieria.com/AddSensor.php', {
                        method: 'POST',
                        body: formData,
                    });
    
                    const data = await response.json();
                    if (response.ok) {
                        Alert.alert('Éxito', data.message);
    
                        // Recargar los permisos y sensores disponibles
                        await fetchPermissions();
                        await fetchAvailableSensors(selectedUserName);
    
                        // Cerrar el modal
                        setModalVisible(false);
    
                        // Incrementa la clave de recarga para forzar el render
                        setReloadKey(prevKey => prevKey + 1);
                    } else {
                        Alert.alert('Error', data.error || 'Error al agregar el sensor');
                    }
                } else {
                    Alert.alert('Error', 'Usuario no encontrado');
                }
            } catch (error) {
                console.error('Error al agregar el sensor:', error);
                Alert.alert('Error', 'Error al agregar el sensor');
            }
        } else {
            Alert.alert('Error', 'Selecciona un usuario y un sensor');
        }
    };
                        
    const handleRemoveSensor = async (userName: string, sensorName: string) => {
        try {
            const sensorId = allSensors.find(sensor => sensor.nombre === sensorName)?.id;
            if (sensorId) {
                const userId = permissions.find(user => user.usuario === userName)?.usuario_id;
    
                if (userId) {
                    const formData = new FormData();
                    formData.append('usuario_id', userId);
                    formData.append('sensor_id', sensorId);
    
                    const response = await fetch('https://servicoldingenieria.com/RemoveSensor.php', {
                        method: 'POST',
                        body: formData,
                    });
    
                    const data = await response.json();
                    if (response.ok) {
                        Alert.alert('Éxito', data.message);
    
                        // Actualiza todos los permisos después de eliminar el sensor
                        await fetchPermissions();  // Refrescar lista completa de permisos
                        await fetchAvailableSensors(userName);  // Refrescar sensores disponibles para el usuario
                        setReloadKey(prevKey => prevKey + 1);
                    } else {
                        Alert.alert('Error', data.error || 'Error al eliminar el sensor');
                    }
                } else {
                    Alert.alert('Error', 'Usuario no encontrado');
                }
            } else {
                Alert.alert('Error', 'Sensor no encontrado');
            }
        } catch (error) {
            console.error('Error al eliminar el sensor:', error);
            Alert.alert('Error', 'Error al eliminar el sensor');
        }
    };
                

    const openModal = (userName: string) => {
        setSelectedUserName(userName);  // Cambia el usuario seleccionado
        setAvailableSensors([]);  // Limpia los sensores disponibles del estado anterior
        fetchAvailableSensors(userName);  // Carga los sensores disponibles para el nuevo usuario
        setModalVisible(true);  // Abre el modal
        };

        const renderItem = ({ item }: { item: UserPermissions }) => (
            <View style={[styles.itemContainer, { backgroundColor: theme.colors.targetBackground }]}>
                <Text style={[styles.itemTitle, { color: theme.colors.text }]}>{item.usuario}</Text>
                <View style={styles.sensorContainer}>
                    {/* Mostrar sensores asignados si los hay */}
                    {item.sensores.length > 0 ? item.sensores.map(sensor => (
                        <View key={sensor} style={styles.sensorRow}>
                            <Text style={[styles.itemText, { color: theme.colors.onSurface }]}>{sensor}</Text>
                            <TouchableOpacity
                                style={[styles.removeButton, { backgroundColor: theme.colors.cancel }]}
                                onPress={() => handleRemoveSensor(item.usuario, sensor)}
                            >
                                <Text style={styles.removeButtonText}>Eliminar</Text>
                            </TouchableOpacity>
                        </View>
                    )) : <Text style={[styles.itemText, { color: theme.colors.onSurface }]}>No hay sensores asignados</Text>}
                    
                    {/* Asegurar que el botón "Agregar Sensor" siempre se muestra */}
                    <TouchableOpacity
                        style={styles.addSensorContainer}
                        onPress={() => openModal(item.usuario)}
                    >
                        <Text style={[styles.agregarText, { color: theme.colors.accept }]}>Agregar sensor</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
                
    if (loading || !permissions) {
        return (
            <LinearGradient colors={theme.colors.backgroundGradient} style={styles.gradient}>
                <View style={styles.container}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={{ color: theme.colors.text }}>Cargando...</Text>
                </View>
            </LinearGradient>
        );
    }
    
    if (error) {
        return (
            <LinearGradient colors={theme.colors.backgroundGradient} style={styles.gradient}>
                <View style={styles.container}>
                    <Text style={{ color: theme.colors.onBackground }}>{error}</Text>
                </View>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={theme.colors.backgroundGradient} style={styles.gradient}>
            <View style={styles.container}>
                <FlatList
                    key={reloadKey} // Añade la clave aquí para forzar la recarga
                    data={permissions}
                    renderItem={renderItem}
                    keyExtractor={item => item.usuario_id}
                    contentContainerStyle={styles.list}
                />
                <Modal
                    transparent={true}
                    visible={modalVisible}
                    animationType="slide"
                    style={styles.modalContainer}
                >
                    <View style={styles.modalContainer}>
                        <ScrollView style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                            <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]}>Seleccionar Sensor</Text>
                            <View style={styles.modalScrollView}>
                                {availableSensors.length > 0 ? availableSensors.map(sensor => (
                                    <TouchableHighlight
                                        key={sensor.id}
                                        onPress={() => handleAddSensor(sensor.id)} // Agrega el sensor directamente al hacer clic
                                        style={[styles.sensorItem, { borderBottomColor: theme.colors.border }]}
                                    >
                                        <Text style={{ color: theme.colors.onSurface }}>{sensor.nombre}</Text>
                                    </TouchableHighlight>
                                )) : <Text>No hay sensores disponibles para agregar</Text>}
                            </View>
                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: theme.colors.error }]}
                                onPress={closeModal}  // Cierra el modal al presionar el botón
                            >
                                <Text style={styles.buttonText}>Cerrar</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </Modal>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradient:{
        flex:1,
    },
    container: {
        flex: 1,
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    list: {
        marginBottom: 20,
    },
    itemContainer: {
        padding: 10,
        borderRadius: 10,
        marginBottom: 10,
        marginVertical: 8,
        borderWidth: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 4,

    },
    itemTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    itemText: {
        fontSize: 16,
        flex: 1,
        flexShrink: 1,
    },
    agregarText:{
        fontSize: 16,
        fontWeight: 400,
    },
    sensorContainer: {
        marginVertical: 10,
    },
    sensorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 5,
        justifyContent: 'space-between',
    },
    removeButton: {
        borderRadius: 4,
        padding: 5,
    },
    removeButtonText: {
        color: '#ffffff',
    },
    addSensorContainer: {
        marginVertical: 10,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        width: '80%',
        borderRadius: 10,
        padding: 10,
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalScrollView: {
        width: '100%',
    },
    sensorItem: {
        padding: 10,
        borderBottomWidth: 1,
        marginBottom: 15,
    },
    buttonText: {
        fontSize: 16,
    },
    button: {
        marginBottom: 15,
        fontSize: 16,
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default PermisosScreen;
