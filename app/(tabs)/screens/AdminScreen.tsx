import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet, FlatList, TextInput, Alert, ScrollView, ActivityIndicator} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from './types';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import { useTheme } from './ThemeProvider'; 
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';

type AdminScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Admin'>;

interface User {
    id: number;
    nombre: string;
    email: string;
    password: string;
    rol: string;
}

interface Sensor {
    id: number;
    nombre: string;
    tipo: string;
    codigo_unico: string;
}

interface UserFormProps {
    onSave: (user: { id?: number; nombre: string; email: string; password: string; rol: string }) => void;
    userToEdit?: { id?: number; nombre: string; email: string; password: string; rol: string };
    onCancel: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ onSave, userToEdit, onCancel }) => {
    const [nombre, setNombre] = useState(userToEdit?.nombre || '');
    const [email, setEmail] = useState(userToEdit?.email || '');
    const [password, setPassword] = useState(userToEdit?.password || '');
    const [rol, setRol] = useState(userToEdit?.rol || 'cliente');
    const { theme } = useTheme();

    const handleSave = () => {
        if (!nombre || !email) {
            Alert.alert('Error', 'Nombre y Email son obligatorios.');
            return;
        }
        // Validar si se está creando un nuevo usuario (sin `userToEdit`)
        if (!userToEdit && !password) {
            Alert.alert('Error', 'La contraseña es obligatoria al registrar un nuevo usuario.');
            return;
        }
        
        const userData = {
            id: userToEdit?.id,
            nombre,
            email,
            // Solo incluye la contraseña si se está creando un nuevo usuario
            password: userToEdit ? '' : password,  // Si estamos editando, asignamos una cadena vacía
            rol,
        };

        onSave(userData);
    };


    return (
        <View style={[styles.formContainer, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.formTitle, { color: theme.colors.text }]}>{userToEdit ? 'Editar Usuario' : 'Agregar Usuario'}</Text>
            <TextInput
                style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
                placeholder="Nombre"
                placeholderTextColor={'theme.colors.text'}
                value={nombre}
                onChangeText={setNombre}
            />
            <TextInput
                style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
                placeholder="Email"
                placeholderTextColor={theme.colors.text}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
            />
            {!userToEdit && (
                <TextInput
                    style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
                    placeholder="Contraseña"
                    placeholderTextColor={theme.colors.text}
                    value={password}
                    onChangeText={setPassword}
                    keyboardType="visible-password"
                    secureTextEntry
                />
            )}
            <Picker
                selectedValue={rol}
                onValueChange={(itemValue) => setRol(itemValue)}
                style={{ ...styles.picker, color: theme.colors.text }}
                itemStyle={{ color: theme.colors.text }}
            >
                <Picker.Item label="Admin" value="admin" />
                <Picker.Item label="Cliente" value="cliente" />
            </Picker>
            <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.accept }]} onPress={handleSave}>
                <Text style={[styles.buttonText, { color: theme.colors.buttonText }]}>{userToEdit ? 'Guardar Cambios' : 'Agregar Usuario'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.cancelButton, { backgroundColor: theme.colors.cancel }]} onPress={onCancel}>
                <Text style={[styles.buttonText, { color: theme.colors.text }]}>Cancelar</Text>
            </TouchableOpacity>
        </View>
    );
};

interface SensorFormProps {
    onSave: (sensor: { id?: number; nombre: string; tipo: string }) => void;
    sensorToEdit?: { id?: number; nombre: string; tipo: string };
    onCancel: () => void;
}

const SensorForm: React.FC<SensorFormProps> = ({ onSave, sensorToEdit, onCancel }) => {
    const [nombre, setNombre] = useState(sensorToEdit?.nombre || '');
    const [tipo, setTipo] = useState(sensorToEdit?.tipo || 'Temperatura');
    const { theme } = useTheme();

    const handleSave = () => {
        if (!nombre) {
            Alert.alert('Error', 'Nombre del Sensor es obligatorio.');
            return;
        }
        onSave({ id: sensorToEdit?.id, nombre, tipo });
    };

    return (
        <View style={[styles.formContainer, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.formTitle, { color: theme.colors.text }]}>{sensorToEdit ? 'Editar Sensor' : 'Agregar Sensor'}</Text>
            <TextInput
                style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text }]}
                placeholder="Nombre del Sensor"
                placeholderTextColor={theme.colors.text}
                value={nombre}
                onChangeText={setNombre}
            />
            <Picker
                selectedValue={tipo}
                onValueChange={(itemValue) => setTipo(itemValue)}
                style={{ ...styles.picker, color: theme.colors.text }}
                itemStyle={{ color: theme.colors.text }}
            >
                <Picker.Item label="Combustible" value="combustible" />
                <Picker.Item label="Temperatura" value="temperatura" />
                <Picker.Item label="Energía" value="energia" />
            </Picker>
            <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.accept }]} onPress={handleSave}>
                <Text style={[styles.buttonText, { color: theme.colors.buttonText }]}>{sensorToEdit ? 'Guardar Cambios' : 'Agregar Sensor'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.cancelButton, { backgroundColor: theme.colors.cancel }]} onPress={onCancel}>
                <Text style={[styles.buttonText, { color: theme.colors.text }]}>Cancelar</Text>
            </TouchableOpacity>
        </View>
    );
};

const AdminScreen: React.FC = () => {
    const [usuarios, setUsuarios] = useState<User[]>([]);
    const [sensores, setSensores] = useState<Sensor[]>([]);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [sensorToEdit, setSensorToEdit] = useState<Sensor | null>(null);
    const [showUserForm, setShowUserForm] = useState(false);
    const [showSensorForm, setShowSensorForm] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const { theme } = useTheme();
    const [loading, setLoading] = useState(true); // Estado de carga
    const [isSearchOpen, setIsSearchOpen] = useState(false); // Controla si la búsqueda está abierta
    const [searchQuery, setSearchQuery] = useState('');


    const capitalizeFirstLetter = (str: string) => {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
      };
          

    useEffect(() => {
        fetchUsers();
        fetchSensors();
    }, []);

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={styles.headerRightContainer}>
                    {/* Icono de Lupa para abrir/cerrar búsqueda */}
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => {
                            if (isSearchOpen) {
                                setSearchQuery(''); // Restablece el filtro de búsqueda al cerrar
                            }
                            setIsSearchOpen(!isSearchOpen); // Alterna la visibilidad de la búsqueda
                        }}
                    >
                        {/* Cambia el ícono entre search y close */}
                        <Icon name={isSearchOpen ? "close" : "search"} size={24} color={theme.colors.text} />
                    </TouchableOpacity>

                    {/* Input de búsqueda visible si isSearchOpen es true */}
                    {isSearchOpen && (
                        <TextInput
                            style={styles.searchInput}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Buscar por nombre..."
                            placeholderTextColor={'#525050'}
                        />
                    )}

                    {/* Icono de tres puntitos para abrir opciones */}
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => setModalVisible(true)} // Abre el modal para opciones
                    >
                        <Icon name="more-vert" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>
            ),
        });
    }, [navigation, theme, isSearchOpen, searchQuery]);


    const filteredUsuarios = usuarios.filter(user =>
        user.nombre.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const filteredSensores = sensores.filter(sensor =>
        sensor.nombre.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const fetchUsers = async () => {
        try {
            setLoading(true); // Comienza la carga
            const response = await axios.get<User[]>('https://servicoldingenieria.com/listarUsuarios.php');
            setUsuarios(response.data); // Guarda los usuarios en el estado
        } catch (error) {
            console.error(error); // Manejo de errores
        } finally {
            setLoading(false); // Finaliza la carga
        }
    };
    
    const fetchSensors = async () => {
        try {
            setLoading(true); // Comienza la carga
            const response = await axios.get<Sensor[]>('https://servicoldingenieria.com/listarSensores.php');
            setSensores(response.data); // Guarda los usuarios en el estado
        } catch (error) {
            console.error(error); // Manejo de errores
        } finally {
            setLoading(false); // Finaliza la carga
        }
    };
    

    const handleAddUser = (user: { id?: number; nombre: string; email: string; password?: string; rol: string }) => {
        const url = user.id ? 'https://servicoldingenieria.com/editarUsuario.php' : 'https://servicoldingenieria.com/registrarUsuario.php';
        
        const params = new URLSearchParams({
            user_id: user.id?.toString() || '',
            nombre: user.nombre,
            email: user.email,
            rol: user.rol,
        });
    
        // Solo se agrega la contraseña si se está creando un nuevo usuario
        if (!user.id) {
            params.append('password_hash', user.password || '');
        }
    
        axios.post(url, params.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
        .then(response => {
            const data = response.data;
            if (typeof data === 'string') {
                if (data.includes("Usuario guardado con éxito")) {
                    fetchUsers();
                    setUserToEdit(null);
                    setShowUserForm(false);
                    Alert.alert('Éxito', 'Usuario guardado con éxito.');
                } else {
                    Alert.alert('Error', 'No se pudo guardar el usuario.');
                }
            } else if (data.message) {
                Alert.alert('Éxito', data.message);
                setShowUserForm(false);
                setUserToEdit(null);
                fetchUsers();
            } else if (data.error) {
                Alert.alert('Error', data.error);
            }
        })
        .catch(error => {
            console.error('Add User Error:', error);
            Alert.alert('Error', 'Ocurrió un error al guardar el usuario.');
        });
    };
    
    const handleAddSensor = (sensor: { id?: number; nombre: string; tipo: string }) => {
        const url = sensor.id ? 'https://servicoldingenieria.com/editarSensor.php' : 'https://servicoldingenieria.com/registrarSensor.php';
        axios.post(url, new URLSearchParams({
            sensor_id: sensor.id?.toString() || '',
            nombre: sensor.nombre,
            tipo: sensor.tipo
        }).toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
        .then(response => {
            const data = response.data;
            if (typeof data === 'string') {
                if (data.includes("Sensor guardado con éxito")) {
                    fetchSensors();
                    setSensorToEdit(null);
                    setShowSensorForm(false);
                    Alert.alert('Éxito', 'Sensor guardado con éxito.');
                } else {
                    Alert.alert('Error', 'No se pudo guardar el sensor.');
                }
            } else if (data.message) {
                Alert.alert('Éxito', data.message);
                fetchSensors();
                setSensorToEdit(null);
                setShowSensorForm(false);
            } else if (data.error) {
                Alert.alert('Error', data.error);
            }
        })
        .catch(error => {
            console.error('Add Sensor Error:', error);
            Alert.alert('Error', 'Ocurrió un error al guardar el sensor.');
        });
    };

    const handleEditUser = (user: User) => {
        setUserToEdit(user);
        setShowUserForm(true);
    };
    
    const handleEditSensor = (sensor: Sensor) => {
        setSensorToEdit(sensor);
        setShowSensorForm(true);
    };

    const handleDeleteUser = (id: number) => {
        Alert.alert('Confirmación', '¿Estás seguro de eliminar este usuario?', [
            {
                text: 'Cancelar',
                style: 'cancel',
            },
            {
                text: 'Eliminar',
                onPress: () => {
                    axios.post('https://servicoldingenieria.com/eliminarUsuario.php', 
                        new URLSearchParams({ id: id.toString() }).toString(), {
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded'
                            }
                        }
                    )
                    .then(response => {
                        if (response.data.includes("Usuario eliminado con éxito")) {
                            fetchUsers();
                            Alert.alert('Éxito', 'Usuario eliminado con éxito.');
                        } else {
                            Alert.alert('Error', 'No se pudo eliminar el usuario.');
                        }
                    })
                    .catch(error => {
                        console.error(error);
                        Alert.alert('Error', 'Ocurrió un error al eliminar el usuario.');
                    });
                },
                style: 'destructive',
            },
        ]);
    };
    
    
    const handleDeleteSensor = (id: number) => {
        Alert.alert('Confirmación', '¿Estás seguro de eliminar este sensor?', [
            {
                text: 'Cancelar',
                style: 'cancel',
            },
            {
                text: 'Eliminar',
                onPress: () => {
                    axios.post('https://servicoldingenieria.com/eliminarSensor.php', 
                        new URLSearchParams({ id: id.toString() }).toString(), {
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded'
                            }
                        }
                    )
                    .then(response => {
                        if (response.data.includes("Sensor eliminado con éxito")) {
                            fetchUsers();
                            Alert.alert('Éxito', 'Sensor eliminado con éxito.');
                        } else {
                            Alert.alert('Error', 'No se pudo eliminar el Sensor.');
                        }
                    })
                    .catch(error => {
                        console.error(error);
                        Alert.alert('Error', 'Ocurrió un error al eliminar el Sensor.');
                    });
                },
                style: 'destructive',
            },
        ]);
    };


    return (
        <LinearGradient colors={theme.colors.backgroundGradient} style={styles.gradient}>
            <FlatList
            ListHeaderComponent={
                <>
                    <Text style={[styles.title, { color: theme.colors.text }]}>Usuarios</Text>
                    {loading && <ActivityIndicator size="large" color={theme.colors.primary} />}
                </>
            }
            data={filteredUsuarios}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
                <View style={[styles.listItem, { backgroundColor: theme.colors.targetBackground }]}>
                    <Text style={[styles.itemText, { color: theme.colors.text }]}>{item.nombre}</Text>
                    <Text style={[styles.userData, { color: theme.colors.text }]}>Correo: {item.email}</Text>
                    <Text style={[styles.userData, { color: theme.colors.text }]}>Rol: {capitalizeFirstLetter(item.rol)}</Text>
                    <View style={styles.actions}>
                        <TouchableOpacity onPress={() => handleEditUser(item)}>
                            <Icon name="edit" size={24} color={theme.colors.accept} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteUser(item.id)}>
                            <Icon name="delete" size={24} color={theme.colors.cancel} />
                        </TouchableOpacity>
                    </View>
                </View>
            )}
            ListFooterComponent={
                <>
                    <Text style={[styles.title, { color: theme.colors.text }]}>Sensores</Text>
                    {loading ? (
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                    ) : (
                        <FlatList
                            data={filteredSensores}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <View style={[styles.listItem, { backgroundColor: theme.colors.targetBackground }]}>
                                    <Text style={[styles.itemText, { color: theme.colors.text }]}>{item.nombre}</Text>
                                    <Text style={[styles.userData, { color: theme.colors.text }]}>
                                        Tipo: {capitalizeFirstLetter(item.tipo)}
                                    </Text>
                                    <Text style={[styles.userData, { color: theme.colors.text }]}>
                                        Código: {item.codigo_unico}
                                    </Text>
                                    <View style={styles.actions}>
                                        <TouchableOpacity onPress={() => handleEditSensor(item)}>
                                            <Icon name="edit" size={24} color={theme.colors.accept} />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleDeleteSensor(item.id)}>
                                            <Icon name="delete" size={24} color={theme.colors.cancel} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        />
                    )}
                </>
            }
        />


                <Modal
                    visible={showUserForm || showSensorForm}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => {
                        setShowUserForm(false);
                        setShowSensorForm(false);
                    }}
                >
                    <View style={styles.modalContainer}>
                        <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                            {showUserForm ? (
                                <UserForm
                                    onSave={handleAddUser}
                                    userToEdit={userToEdit || undefined}
                                    onCancel={() => setShowUserForm(false)}
                                />
                            ) : (
                                <SensorForm
                                    onSave={handleAddSensor}
                                    sensorToEdit={sensorToEdit || undefined}
                                    onCancel={() => setShowSensorForm(false)}
                                />
                            )}
                        </View>
                    </View>
                </Modal>

                {/* Modal para gestión de permisos */}
                <Modal
                    visible={modalVisible}
                    animationType="fade"
                    transparent={true}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
                        <View style={styles.permissionModal}>

                            {/* Botón para agregar usuario */}
                            <TouchableOpacity
                                style={[styles.menuItem, { backgroundColor: 'green' }]}
                                onPress={() => {
                                    setModalVisible(false);
                                    setUserToEdit(null);
                                    setShowUserForm(true);
                                }}
                            >
                                <Text style={{ color: '#fff' }}>AGREGAR USUARIO</Text>
                            </TouchableOpacity>

                            {/* Botón para agregar sensor */}
                            <TouchableOpacity
                                style={[styles.menuItem, { backgroundColor: 'green' }]}
                                onPress={() => {
                                    setModalVisible(false);
                                    setSensorToEdit(null);
                                    setShowSensorForm(true);
                                }}
                            >
                                <Text style={{ color: '#fff' }}>AGREGAR SENSOR</Text>
                            </TouchableOpacity>

                            {/* Botón para gestionar permisos */}
                            <TouchableOpacity
                                style={[styles.menuItem, { backgroundColor: 'blue'}]}
                                onPress={() => {
                                    setModalVisible(false);
                                    navigation.navigate('Permisos');
                                }}
                            >
                                <Text style={{ color: '#fff' }}>GESTIONAR PERMISOS</Text>
                            </TouchableOpacity>


                            {/* Botón para cerrar el modal */}
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                style={styles.closeButton}
                            >
                                <Text>CERRAR</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Modal>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradient:{
        flex: 1,
    },
    container: {
        flex: 1,
        padding: 20,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    headerRightContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginTop: 5,
    },
    table: {
        marginBottom: 10,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 1,
    },
    tableCell: {
        flex: 1,
        textAlign: 'center',
    },
    addButton: {
        padding: 10,
        alignItems: 'center',
        borderRadius: 5,
    },
    editButton: {
        padding: 5,
        borderRadius: 5,
    },
    deleteButton: {
        padding: 5,
        borderRadius: 5,
    },
    buttonText: {
        color: '#fff',
    },
    formContainer: {
        padding: 20,
        borderRadius: 5,
    },
    formTitle: {
        fontSize: 20,
        marginBottom: 20,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    input: {
        borderWidth: 1,
        padding: 10,
        marginBottom: 10,
        borderRadius: 5,
    },
    picker: {
        marginBottom: 10,
    },
    button: {
        padding: 10,
        alignItems: 'center',
        borderRadius: 5,
        marginBottom: 10,
    },
    cancelButton: {
        padding: 10,
        alignItems: 'center',
        borderRadius: 5,
    },
    headerButton: {
        padding: 8,
    },
    headerButtonText: {
        fontSize: 24,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fondo oscuro semitransparente
    },
    modalContent: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
    },
    menuItem: {
        padding: 10,
        borderRadius: 10,
        margin: 10,
        fontWeight: 'bold',
        width: '100%',
        textAlign: 'center',
        alignItems: 'center',
    },
    closeButton:{
        fontSize: 20,
        backgroundColor: '#fff',
        fontWeight: 'bold',
        borderRadius: 10,
        padding: 10,
        margin: 5,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fondo oscuro semitransparente
    },
    permissionModal: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
        fontWeight: 'bold',
        fontSize: 20,
    },
    permissionTitle: {
        fontSize: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        marginTop: 20,
        marginLeft: 20,
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        textAlign: 'left',
    },
    listItem: {
        flex: 1,
        padding: 20,
        marginVertical: 8,
        marginHorizontal: 16, // Añade márgenes a los lados
        borderWidth: 3,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 10,
        marginBottom: 25,
    },
    itemText: {
        fontSize: 20,
        fontWeight: 'bold',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',     
    },
    userData:{
        fontSize: 15,
        marginBottom: 5,
    },
    searchInput: {
        width: '260%', // Ajusta según tu preferencia
        height: 50,
        backgroundColor: '#f0f0f0', // Color del input
        borderRadius: 5,
        borderWidth: 2,
        paddingHorizontal: 10,
        paddingVertical: 10,
        color: '#000', // Cambia según el tema
    },
});

export default AdminScreen;

