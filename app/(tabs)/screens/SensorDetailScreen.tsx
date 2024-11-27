import React, { FC, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Button, Alert, Modal, TextInput, Pressable, Switch, ActivityIndicator } from 'react-native';
import { useTheme } from './ThemeProvider';
import { LineChart } from 'react-native-chart-kit';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import * as Notifications from 'expo-notifications';
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native'; // Hook para usar tema
import { RootStackParamList } from './types';
import { TouchableOpacity } from 'react-native';
import moment from 'moment-timezone';
import { Icon } from 'react-native-elements';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../AuthContext';
import { Ionicons } from '@expo/vector-icons';

type SensorDetailScreenRouteProp = RouteProp<RootStackParamList, 'SensorDetail'>;

interface SensorData {
    Temperatura?: string;
    nivel_combustible?: string;
    fecha_actual: string;
    umbral_actual?: string;
    umbral_max_actual?: string;
}

const SensorDetailScreen: FC = () => {
    const { theme } = useTheme();
    const route = useRoute<SensorDetailScreenRouteProp>();
    const { sensorName } = route.params;
    const { sensorId } = route.params;
    const [sensorData, setSensorData] = useState<SensorData[]>([]);
    const [limit, setLimit] = useState('25');
    const [startDate, setStartDate] = useState<Date>(new Date());  // Asigna la fecha actual como valor inicial
    const [endDate, setEndDate] = useState<Date>(new Date());  // Asigna la fecha actual como valor inicial
    const [isStartDatePickerVisible, setStartDatePickerVisibility] = useState(false);
    const [isEndDatePickerVisible, setEndDatePickerVisibility] = useState(false);
    const [dataType, setDataType] = useState<'Temperatura' | 'nivel_combustible' | null>(null);
    const [umbralMin, setUmbralMin] = useState<number | null>(null);
    const [umbralMax, setUmbralMax] = useState<number | null>(null);
    const [isThresholdModalVisible, setThresholdModalVisibility] = useState(false);
    const [newMinThreshold, setNewMinThreshold] = useState<string>('');
    const [newMaxThreshold, setNewMaxThreshold] = useState<string>('');
    const [sensorCode, setSensorCode] = useState<string>('');
    const [notifications, setNotifications] = useState<string[]>([]);
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const [notificationsMuted, setNotificationsMuted] = useState(false); // Estado para silenciar notificaciones
    const { userData } = useAuth(); // Obtener los datos del usuario desde AuthContext
    const [modalVisible, setModalVisible] = useState(false);
    const [expanded, setExpanded] = useState<boolean>(false);  // Para controlar la expansión
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(true);




    const options = [
        { label: '25', value: '25' },
        { label: '50', value: '50' },
        { label: '100', value: '100' },
        { label: '200', value: '200' },
        { label: 'Todos', value: 'all' },
    ];
    const toggleExpand = () => {
        setExpanded(!expanded);  // Alterna entre expandir y colapsar
    };

    const selectOption = (value: string) => {
        setLimit(value);
        setExpanded(false);  // Cierra la expansión después de seleccionar
    };


    useEffect(() => {
        const loadMutedState = async () => {
            try {
                const fcmToken = await AsyncStorage.getItem('fcmToken');  // Obtener el token FCM guardado
                if (!fcmToken) {
                    console.error('No se pudo obtener el token FCM.');
                    return;
                }
        
                // Hacer una solicitud al backend para obtener el estado de muteo del sensor
                const response = await fetch('http://servicoldingenieria.com/back-end/get_sensor_mute_state.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `usuario_id=${userData.userId}&sensor_id=${sensorId}&token=${fcmToken}`  // Enviar los parámetros necesarios
                });
        
                const data = await response.json();
                if (data.success) {
                    const muteado = data.muteado === 1;  // Convertir el valor de muteado a booleano
                    setNotificationsMuted(muteado);  // Actualizar el estado en la interfaz
                    // También puedes guardar este valor en AsyncStorage si deseas mantener la coherencia localmente
                    await AsyncStorage.setItem(`sensorMuted_${sensorName}`, JSON.stringify(muteado));
                } else {
                    console.error('Error al obtener el estado de notificaciones:', data.message);
                }
            } catch (error) {
                console.error('Error loading sensor notification settings from DB:', error);
            }
        };
            
        loadMutedState();  // Llamada para cargar el estado inicial al montar
      }, [sensorName]);  // Solo ejecutar cuando el sensor cambie
    

    useEffect(() => {
        navigation.setOptions({
            title: sensorName,
            headerTitleStyle: { justifyContent: 'center', textAlign:'center'},
        });
    }, [navigation, theme, sensorName]);
    
    const toggleNotifications = async () => {
        const newNotificationsMutedState = !notificationsMuted;
        setNotificationsMuted(newNotificationsMutedState);
        
        try {
            // Guardar el nuevo estado de las notificaciones localmente
            await AsyncStorage.setItem(`sensorMuted_${sensorName}`, JSON.stringify(newNotificationsMutedState));
            Alert.alert(
                newNotificationsMutedState ? 'Notificaciones silenciadas' : 'Notificaciones activadas',
                `Se han ${newNotificationsMutedState ? 'silenciado' : 'activado'} las notificaciones para el sensor ${sensorName}`
            );
    
            // Recuperar el token FCM desde AsyncStorage
            const fcmToken = await AsyncStorage.getItem('fcmToken');
            if (!fcmToken) {
                console.error('No se pudo obtener el token FCM.');
                return;
            }
    
            // Enviar la solicitud al backend para mutear las notificaciones del sensor
            const response = await fetch('http://servicoldingenieria.com/back-end/mute_sensor_notifications.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `usuario_id=${userData.userId}&sensor_id=${sensorId}&muteado=${newNotificationsMutedState}&token=${fcmToken}`  // Incluir el token FCM
            });
    
            const data = await response.json();
            if (!data.success) {
                console.error('Error al actualizar el estado de notificaciones del sensor:', data.message);
            }
        } catch (error) {
            console.error('Error saving sensor notification settings:', error);
        }
    };
            

    const averageData = (data: SensorData[], numSegments: number, dataType: string | null) => {
        if (!dataType) {
            throw new Error("dataType must be provided and must be either 'Temperatura' or 'nivel_combustible'.");
        }
    
        // Si la cantidad de datos es menor o igual a numSegments, devolver los datos originales sin modificar
        if (data.length <= numSegments) {
            return data;
        }
    
        const segmentSize = Math.ceil(data.length / numSegments);  // Calcular el tamaño de los segmentos
        let averagedData: SensorData[] = [];
    
        for (let i = 0; i < data.length; i += segmentSize) {
            const segment = data.slice(i, i + segmentSize);  // Tomar un segmento de datos
    
            if (Array.isArray(segment)) {
                let avgValue = 0;
                if (dataType === 'Temperatura') {
                    avgValue = segment.reduce((sum, item) => sum + parseFloat(item.Temperatura || '0'), 0) / segment.length;
                } else if (dataType === 'nivel_combustible') {
                    avgValue = segment.reduce((sum, item) => sum + parseFloat(item.nivel_combustible || '0'), 0) / segment.length;
                }
    
                const avgDate = segment[Math.floor(segment.length / 2)].fecha_actual;  // Usar la fecha promedio
                const averagedItem: SensorData = { fecha_actual: avgDate };
    
                if (dataType === 'Temperatura') {
                    averagedItem.Temperatura = avgValue.toFixed(2);
                } else {
                    averagedItem.nivel_combustible = avgValue.toFixed(2);
                }
    
                averagedData.push(averagedItem);
            }
        }
    
        return averagedData;  // Devolver los datos promediados
    };
        
    const fetchSensorData = useCallback(async (start: string | null = null, end: string | null = null) => {

        try {
            const startDateParam = start ? `&start_date=${start}` : '';
            const endDateParam = end ? `&end_date=${end}` : '';
    
            const response = await fetch(`https://servicoldingenieria.com/sensorDetalle.php?sensor_name=${sensorName}&limit=${limit}${startDateParam}${endDateParam}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const result = await response.json();
            const tipo = result.tipo;

            // Acceder a los umbrales directamente desde el objeto de respuesta
            const umbralMinimo = result.umbral_actual ? parseFloat(result.umbral_actual) : null;
            if (umbralMinimo !== null) {
                setUmbralMin(umbralMinimo);
            }

            const umbralMaximo = result.umbral_max_actual ? parseFloat(result.umbral_max_actual) : null;
            if (umbralMaximo !== null) {
                setUmbralMax(umbralMaximo);
            }

            if (response.ok && result.data && Array.isArray(result.data)) {
                let filteredData = result.data;

                const dataLimit = 11;
                if (filteredData.length >= dataLimit) {
                    filteredData = averageData(filteredData, dataLimit, tipo);
                }
    
                setDataType(tipo);
                setSensorData(filteredData);
                checkThresholdAlerts(filteredData);
            } else {
                console.error('Error al obtener los datos del sensor:', result.error || 'No data found');
                setSensorData([]);
                setDataType(tipo);
            }
        } catch (error) {
            console.error('Error al obtener los datos del sensor:', error);
            setSensorData([]);
        }
        setLoading(false);
    }, [sensorName, limit]);
            
    const checkThresholdAlerts = (data: SensorData[]) => {
        data.forEach((sensor) => {
            const value = dataType === 'Temperatura'
                ? sensor.Temperatura ? parseFloat(sensor.Temperatura) : null
                : sensor.nivel_combustible ? parseFloat(sensor.nivel_combustible) : null;
    
            if (value !== null) {
                if (umbralMin !== null && value < umbralMin) {
                    if (!notificationsMuted) {
                    sendNotificationAlert(`El valor de ${dataType} es demasiado bajo (${value}${dataType === 'Temperatura' ? '°C' : '%'})`);
                } else if (umbralMax !== null && value > umbralMax) {
                    sendNotificationAlert(`El valor de ${dataType} ha excedido el límite (${value}${dataType === 'Temperatura' ? '°C' : '%'})`);
                }
            }
        }});
    };
    
    const sendNotificationAlert = (message: string) => {
        setNotifications((prevNotifications) => [...prevNotifications, message]);
    
        Notifications.scheduleNotificationAsync({
            content: {
                title: "Alerta de Sensor",
                body: message,
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: null,
        });
    };

    const updateThresholds = async () => {
        
        const minThreshold = newMinThreshold ? parseFloat(newMinThreshold) : null;
        const maxThreshold = newMaxThreshold ? parseFloat(newMaxThreshold) : null;

        // Logs para verificar los valores

        if ((minThreshold !== null && isNaN(minThreshold)) || (maxThreshold !== null && isNaN(maxThreshold))) {
            Alert.alert('Error', 'Umbrales inválidos. Asegúrate de que los valores sean números.');
            return;
        }

        if (minThreshold !== null && maxThreshold !== null && minThreshold > maxThreshold) {
            Alert.alert('Error', 'El umbral mínimo no puede ser mayor que el umbral máximo.');
            return;
        }

        try {
            const bodyParams = new URLSearchParams();
            bodyParams.append('sensor_name', sensorName);
            if (minThreshold !== null) {
                bodyParams.append('nuevo_umbral', newMinThreshold);
            }
            if (maxThreshold !== null) {
                bodyParams.append('nuevo_umbral_max', newMaxThreshold);
            }

            const response = await fetch(`https://servicoldingenieria.com/actualizarUmbral.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: bodyParams.toString()
            });

            const result = await response.json();

            if (response.ok && result.mensaje) {
                Alert.alert('Éxito', result.mensaje);
                if (minThreshold !== null) setUmbralMin(minThreshold);
                if (maxThreshold !== null) setUmbralMax(maxThreshold);
            } else {
                Alert.alert('Error', result.error || 'Error desconocido al actualizar los umbrales');
            }
        } catch (error) {
            console.error('Error al actualizar los umbrales:', error);
            Alert.alert('Error', 'No se pudo actualizar los umbrales. Inténtalo de nuevo.');
        }
        setThresholdModalVisibility(false);
        setNewMinThreshold(''); // Limpiar el campo de umbral mínimo
        setNewMaxThreshold(''); // Limpiar el campo de umbral máximo
    };
            
    useEffect(() => {
        const fetchData = async () => {
            try {
                if (startDate && endDate) {
                    await fetchSensorData(
                        startDate ? moment(startDate).format('YYYY-MM-DD') : null,
                        endDate ? moment(endDate).format('YYYY-MM-DD') : null
                    );
                } else {
                    await fetchSensorData(null, null); // Fetch inicial sin fechas si no están definidas
                }
            } catch (error) {
                console.error("Error al obtener los datos del sensor:", error);
                Alert.alert("Error", "Ocurrió un problema al obtener los datos del sensor: " + error); // Alerta mostrando el error
            }
        };
    
        fetchData();
    }, [startDate, endDate, fetchSensorData]);
       
    if (loading) {
        return (
            <LinearGradient colors={theme.colors.backgroundGradient} style={styles.gradient}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            </LinearGradient>
        );
    }

    const showStartDatePicker = () => {
        setStartDatePickerVisibility(true);
    };
    
    const hideStartDatePicker = () => {
        setStartDatePickerVisibility(false);
    };
    
    const handleConfirmStartDate = (date: Date) => {
        hideStartDatePicker(); // Asegúrate de que solo se oculta una vez
        if (endDate && date > endDate) {
            setErrorMessage('La fecha de inicio no puede ser posterior a la fecha de fin.');
        } else {
            setStartDate(date);
            setErrorMessage(''); // Limpiar el mensaje de error si la fecha es válida
        }
    };
    
    const showEndDatePicker = () => {
        setEndDatePickerVisibility(true);
    };
    
    const hideEndDatePicker = () => {
        setEndDatePickerVisibility(false);
    };
    
    const handleConfirmEndDate = (date: Date) => {
        hideEndDatePicker(); // Asegúrate de que solo se oculta una vez
        if (startDate && date < startDate) {
            setErrorMessage('La fecha de fin no puede ser anterior a la fecha de inicio.');
        } else {
            setEndDate(date);
            setErrorMessage(''); // Limpiar el mensaje de error si la fecha es válida
        }
    };
    
    const getLabelForLimit = (limitValue: any) => {
        const option = options.find(option => option.value === limitValue);
        return option ? option.label : limitValue; // Devuelve el label o el value si no se encuentra
    };
        
            
    const chartData = {
        labels: sensorData.map(data => {
            const fecha = moment(data.fecha_actual).format('DD/MM');
            const hora = moment(data.fecha_actual).format('HH:mm');
            return `${fecha} ${hora}`; // Formato como cadena
        }).reverse(),
        datasets: [
            {
                data: sensorData.map(data =>
                    dataType === 'Temperatura' ? (data.Temperatura ? parseFloat(data.Temperatura) : 0) :
                    dataType === 'nivel_combustible' ? (data.nivel_combustible ? parseFloat(data.nivel_combustible) : 0) :
                    0
                ).reverse(),
                strokeWidth: 3,
                fill: true,
            },
        ],
    };
    const chartStyle = {
        borderColor: '#000000',
        borderWidth: 3,
        borderRadius: 15,
        backgroundColor: theme.colors.targetBackground,
        paddingTop: 40,
        marginVertical:20,
    };
    
    
    const chartConfig = {
        backgroundColor: theme.colors.targetBackground,
        backgroundGradientFrom: theme.colors.targetBackground,
        backgroundGradientTo: theme.colors.targetBackground,
        borderWidth: 3, // Corregir la propiedad para el borde
        color: (opacity = 0.5) => theme.colors.text,
        strokeWidth: 2,
        decimalPlaces: 2,
        propsForDots: {
            r: '5',
            strokeWidth: '2',
            stroke: '#ffa726',
            marginBottom: 10,
            marginTop: 10,
            padding: 15,
        },
        propsForLabels: {
            fontSize: 9,
        },
        propsForHorizontalLabels: {
            fontSize: 10,
        },
        propsForVerticalLabels: {
            rotation: 40,
        },
        responsive: true,
        maintainAspectRatio: false,  // Mantener las proporciones del gráfico
    };
    
    // Asegúrate de que dataType esté definido antes de renderizar los umbrales
    const renderThresholds = () => {
        if (!dataType) {
            return null; // O muestra un mensaje de carga o error
        }

        return (
            <View style={styles.alertasContainer}>
                <Text style={[styles.subTitle, {color: theme.colors.text}]}>Alertas</Text>
                <View style={styles.alertContainer}>
                    {dataType === 'Temperatura' ? (
                        <>
                            <Text style={[styles.alertText, {color: theme.colors.text}]}>Mínimo: {umbralMin}°C</Text>
                            <Text style={[styles.alertText, {color: theme.colors.text}]}>Máximo: {umbralMax}°C</Text>
                        </>
                    ) : (
                        <>
                            <Text style={[styles.alertText, {color: theme.colors.text}]}>Mínimo: {umbralMin}%</Text>
                            <Text style={[styles.alertText, {color: theme.colors.text}]}>Máximo: {umbralMax}%</Text>
                        </>
                    )}
                </View>
                
                <View style={styles.buttonContainer}>
                    <TouchableOpacity 
                        onPress={() => setThresholdModalVisibility(true)}
                        style={[styles.botonAlertas, {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20}]}
                    >
                        <Icon name="edit" size={20} color={theme.colors.text} style={{marginRight: 10}} />
                        <Text style={[styles.botonAlertasText, {color: theme.colors.text}]}>Modificar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <LinearGradient colors={theme.colors.backgroundGradient} style={styles.gradient}>
            <ScrollView style={styles.container}>
                <Text style={[styles.subTitle, {color: theme.colors.text}]}>Notificaciones</Text>
                <View style={styles.switchContainer}>
                <Text style={[{fontSize: 16},{ color: theme.colors.text }]}>Silenciar Notificaciones</Text>
                <Switch
                    value={notificationsMuted}
                    onValueChange={toggleNotifications}
                    trackColor={{
                        false: theme.dark ? '#808080' : '#d3d3d3', // Fondo gris cuando está desactivado
                        true: theme.colors.primary, // Color del tema cuando está activado
                    }}
                    thumbColor={notificationsMuted ? theme.colors.text : '#f4f3f4'} // Cambia el color del círculo del switch
                />
            </View>


                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={isThresholdModalVisible}
                    onRequestClose={() => setThresholdModalVisibility(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>ACTUALIZAR ALERTAS</Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Nuevo umbral mínimo"
                                keyboardType="numeric"
                                value={newMinThreshold}
                                onChangeText={setNewMinThreshold}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Nuevo umbral máximo"
                                keyboardType="numeric"
                                value={newMaxThreshold}
                                onChangeText={setNewMaxThreshold}
                            />

                            <TouchableOpacity onPress={updateThresholds} style={styles.button}>
                                <Text style={[styles.buttonText, {color: theme.colors.buttonText}]}>ACTUALIZAR</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                onPress={() => {
                                    setThresholdModalVisibility(false);
                                    setNewMinThreshold(''); // Limpiar el campo de umbral mínimo
                                    setNewMaxThreshold(''); // Limpiar el campo de umbral máximo
                                }} 
                                style={[styles.button, styles.cancelButton]}
                            >
                                <Text style={[styles.buttonText, {color: theme.colors.buttonText}]}>CANCELAR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                <Text style={[styles.subTitle, {color: theme.colors.text}]}>Ajustar registros</Text>
                <View style={styles.faqContainer}>
                    <TouchableOpacity
                        style={styles.questionContainer}
                        onPress={toggleExpand}  // Expande o colapsa al presionar
                    >
                        <Text style={[styles.questionText, { color: theme.colors.text }]}>
                            Cantidad de registros: {getLabelForLimit(limit)}
                        </Text>
                        <Ionicons
                            name={expanded ? 'chevron-up' : 'chevron-down'}
                            size={15}
                            color={theme.colors.text}
                        />
                    </TouchableOpacity>

                    {expanded && (
                        <View style={styles.answerContainer}>
                            {options.map((option, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.optionButton}
                                    onPress={() => selectOption(option.value)}  // Selecciona la opción
                                >
                                    <Text style={[styles.optionText, { color: theme.colors.text }]}>
                                        {option.label}
                                    </Text>
                                    {limit === option.value && (
                                        <Ionicons name="checkmark-circle" size={20} color="green" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>


                <View style={styles.datePickerContainer}>
                    {/* Fecha Inicial */}
                    <View style={styles.dateRow}>
                        <Text style={[styles.dateText, {color: theme.colors.text}]}>Fecha inicial: {moment(startDate).format('DD/MM/YYYY')}</Text>
                        <TouchableOpacity onPress={showStartDatePicker}>
                            <Ionicons name="calendar" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>
                    <View style={{ borderRadius: 20, overflow: 'hidden' }}>
                        <DateTimePickerModal
                            isVisible={isStartDatePickerVisible}
                            mode="date"
                            onConfirm={handleConfirmStartDate}
                            onCancel={hideStartDatePicker}
                            date={startDate || new Date()} // Muestra la fecha actual por defecto
                            maximumDate={new Date()} // Bloquea las fechas futuras
                        />
                    </View>

                    {/* Fecha Final */}
                    <View style={styles.dateRow}>
                        <Text style={[styles.dateText, {color: theme.colors.text}]}>Fecha final: {moment(endDate).format('DD/MM/YYYY')}</Text>
                        <TouchableOpacity onPress={showEndDatePicker}>
                            <Ionicons name="calendar" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>
                    <DateTimePickerModal
                        isVisible={isEndDatePickerVisible}
                        mode="date"
                        onConfirm={handleConfirmEndDate}
                        onCancel={hideEndDatePicker}
                        date={endDate || new Date()} // Muestra la fecha actual por defecto
                        maximumDate={new Date()} // Bloquea las fechas futuras
                    />
                    {errorMessage ? <Text style={{ color: 'red' }}>{errorMessage}</Text> : null}
                </View>

                {renderThresholds()}

                {sensorData.length > 0 && dataType ? (
                    <>

                    <LineChart
                        data={chartData}    
                        width={Dimensions.get('window').width - 50} // Ajusta el ancho del gráfico
                        height={475}
                        chartConfig={chartConfig}
                        bezier
                        style={chartStyle} // Aplica el estilo personalizado aquí
                        xLabelsOffset={5}
                        yAxisSuffix={dataType === 'Temperatura' ? '°C' : '%'}
                        />

                    <View style={[styles.tableContainer, { backgroundColor: theme.colors.targetBackground }]}>
                        <Text style={[styles.tableHeader, { color: theme.colors.text }]}>Datos del Sensor</Text>
                        
                        {/* Encabezados de la tabla */}
                        <View style={styles.tableHeaderRow}>
                            <Text style={[styles.tableCellHeader, { color: theme.colors.text }]}>
                                {dataType === 'Temperatura' ? 'Temperatura' : 'Combustible'}
                            </Text>
                            <Text style={[styles.tableCellHeader, { color: theme.colors.text }]}>Fecha</Text>
                        </View>
                        
                        {/* Lecturas de los sensores */}
                        {sensorData.slice().map((data, index) => (
                            <View key={index} style={styles.tableRow}>
                                <View style={styles.tableCellContainer}>
                                    <Text style={[styles.tableCell, { color: theme.colors.text }]}>
                                        {dataType === 'Temperatura' ? `${data.Temperatura}°C` :
                                        dataType === 'nivel_combustible' ? `${data.nivel_combustible}%` : ''}
                                    </Text>
                                </View>
                                <View style={styles.tableCellContainer}>
                                    <Text style={[styles.tableCell, { color: theme.colors.text }]}>
                                        {`${moment(data.fecha_actual).format('DD/MM/YY')} ${moment(data.fecha_actual).format('HH:mm')} hs`}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                    </>
                ) : (
                    <Text style={styles.noDataText}>No hay datos disponibles</Text>
                )}
                <Modal
                    visible={modalVisible}
                    animationType="fade"
                    transparent={true}
                    onRequestClose={() => setModalVisible(false)}
                >
                    <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
                        <View style={styles.permissionModal}>
                            {/* Botón de Rango de alerta */}
                            <TouchableOpacity onPress={() => setThresholdModalVisibility(true)} style={styles.alertButton}>
                                <Text style={{ textAlign: 'center', fontSize: 20, borderRadius: 10, padding: 5, color: '#e50404', fontWeight: 'bold' }}>
                                    RANGO DE ALERTA
                                </Text>
                            </TouchableOpacity>
                            {/* Botón de cerrar modal */}
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                                <Text style={{ textAlign: 'center', fontSize: 18, borderRadius: 10, padding: 10 }}>CERRAR</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Modal>

            </ScrollView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
        paddingHorizontal: 5,
    },
    container: {
        flex: 1,
        padding: 10,
    },
    loadingContainer: {
        flex: 1, // Ocupar todo el espacio disponible
        justifyContent: 'center', // Centrar verticalmente
        alignItems: 'center', // Centrar horizontalmente
        height: '100%', // Ocupar toda la altura de la pantalla
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
        textAlign: 'center',
    },
    subTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    alertText: { color: 'red', textAlign: 'center', fontSize: 16, marginHorizontal: 10},
    closeText: { textAlign: 'center', color: 'white' },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        textAlign: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    alertasContainer: {
        flexDirection: 'column',
        justifyContent: 'center',
        textAlign: 'center',
        alignItems: 'center',
        marginBottom: 5,
    },
    alertContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        textAlign: 'center',
        alignItems: 'center',
    },
    picker: {
        height: 30,
        width: '50%',
        alignSelf: 'center',
        backgroundColor: '#e0e0e0',
        marginBottom: 20,
        borderRadius: 15,
        borderWidth: 2,
    },
    datePickerContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: 10,
        width: '100%',
    },
    dateText: {
        fontSize: 16,
        color: '#333',
    },
    pickerButton: {
        flexDirection: 'row',            // Los elementos dentro del botón (texto + icono) están en fila
        justifyContent: 'center',        // Alineación central del contenido
        alignItems: 'center',            // Alineación vertical centrada
        borderWidth: 1,
        borderRadius: 10,
        padding: 10,
        backgroundColor: '#fff',
        width: 120,                      // Puedes ajustar el ancho del botón seg��n tu diseño
    },
    pickerButtonText: {
        marginRight: 10,
        fontSize: 16,
        color: 'black',        // Asegura que el color del texto se adapta al tema
    },
    optionButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 5,
        width: '100%',
    },
    optionText: {
        fontSize: 16,
        color: 'black',        // Asegura que el color del texto se adapta al tema
    },
    closeButtonText: {
        color: 'red',
        fontSize: 16,
    },
    chartContainer: {
        alignItems: 'center',
        justifyContent: 'flex-start',
        textAlign: 'center',
        borderRadius: 20,
        marginHorizontal: 0, // Añade espacio a los lados
        marginVertical: 20,
    },
    tableContainer: {
        marginTop: 10,
        marginBottom: 20,
        padding: 15,
        borderRadius: 15,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        borderWidth: 3,
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',  // Alinea el texto de la fecha y el icono de calendario
        alignItems: 'center',
        paddingVertical: 10,
        marginVertical: 5,
        width: '100%',
    },
    row:{
        flexDirection: 'row',
        justifyContent: 'space-between', // Espaciado entre el label y el botón
        alignItems: 'center', // Alinea verticalmente al centro
        marginVertical: 8, // Ajusta el espacio vertical si es necesario
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Fondo oscuro semitransparente
    },
    permissionModal: {
        width: '60%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
        fontWeight: 'bold',
        fontSize: 25,
    },
    closeButton:{
        fontSize: 20,
        backgroundColor: '#fff',
        fontWeight: 'bold',
        borderRadius: 10,
        padding: 5,
    },
    tableHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    tableHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    tableRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 5,
    },
    tableCellContainer: {
        flex: 1, // Hace que cada celda ocupe el mismo espacio
        alignItems: 'center', // Centra el contenido horizontalmente
        justifyContent: 'center', // Centra el contenido verticalmente
    },
    tableCell: {
        flex: 1,
        textAlign: 'center',
        fontSize: 16,
    },
    tableCellHeader: {
        flex: 1,
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 16,
    },
    noDataText: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
        marginTop: 20,
    },
    alertButton: {
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: 10,
        width: '100%',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '90%',
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    faqContainer: { marginBottom: 10, fontSize: 16 },
    questionContainer: {
      paddingTop: 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
    },
    buttonContainer: {
        marginTop: 10,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: 20,
    },
    questionText: { fontSize: 16},
    answerContainer: { paddingHorizontal: 15, marginTop: 10 },
    answerText: { fontSize: 16 },  
    button: {
        backgroundColor: 'green',
        padding: 12,
        borderRadius: 10,
        marginTop: 10,
        width: '100%',
        alignItems: 'center',
    },
    headerButton: {
        marginRight: 20,
        padding: 10,
    },
    cancelButton: {
        backgroundColor: "#e50404",
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    input: {
        width: '100%',
        borderColor: '#ccc',
        borderWidth: 1,
        padding: 10,
        marginVertical: 10,
        borderRadius: 10,
    },
    modalTitle: {
        fontSize: 20,
        marginBottom: 15,
        fontWeight: 'bold'
    },
    botonAlertas: {
        fontSize: 20,
        fontWeight: 'bold',
        borderRadius: 10,
        width: '60%',
        textAlign: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    botonAlertasText: {
        fontSize: 18,
        fontWeight: 500,
    },
});

export default SensorDetailScreen;
