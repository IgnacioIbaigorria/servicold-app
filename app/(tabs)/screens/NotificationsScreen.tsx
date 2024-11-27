import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { useTheme } from './ThemeProvider';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../AuthContext';
import axios from 'axios';

const NotificationsScreen: React.FC = () => {
  const { userData } = useAuth(); // Obtener los datos del usuario desde AuthContext
  const { theme } = useTheme();
  const [userNotifications, setUserNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false); // Para cargar más notificaciones
  const [page, setPage] = useState(1); // Paginación
  const [hasMore, setHasMore] = useState(true); // Si hay más notificaciones por cargar
  const [isRefreshing, setIsRefreshing] = useState(false);


  // Número de notificaciones por página
  const PAGE_SIZE = 15;

  const onRefresh = async () => {
    await fetchUserNotifications(1);
};


  // Función para obtener las notificaciones
  const fetchUserNotifications = async (page: number) => {
    setIsLoading(page === 1); // Mostrar el indicador de carga solo al cargar la primera página
    setIsLoadingMore(page > 1); // Mostrar un indicador para más notificaciones
    try {
      // Llama al endpoint del servidor para obtener las notificaciones
      const response = await axios.get('https://servicoldingenieria.com/back-end/getUserNotifications.php', {
        params: {
          user_id: userData.userId,
          page: page, // Añadimos paginación
          limit: PAGE_SIZE,
        },
      });

      const newNotifications = response.data;

      // Si no hay más notificaciones, detener la carga
      if (newNotifications.length < PAGE_SIZE) {
        setHasMore(false);
      }

      // Actualizar las notificaciones existentes
      setUserNotifications((prevNotifications) =>
        page === 1 ? newNotifications : [...prevNotifications, ...newNotifications]
      );
    } catch (error) {
      console.error('Error al cargar las notificaciones:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Cargar la primera página al inicio
  useEffect(() => {
    fetchUserNotifications(1);
  }, [userData]);

  // Función que se ejecuta cuando se llega al final de la lista
  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      setPage((prevPage) => prevPage + 1);
      fetchUserNotifications(page + 1);
    }
  };

  if (isLoading) {
    return (
        <LinearGradient colors={theme.colors.backgroundGradient} style={styles.gradient}>
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        </LinearGradient>
    );
}


  // Renderizar cada notificación
  const renderNotification = ({ item }: { item: any }) => (
    <View style={[styles.notificationItem, { backgroundColor: theme.colors.targetBackground }, {borderWidth: 2}, {borderColor: theme.colors.text}]}>
      <View style={styles.notificationContent}>
        <Text style={[styles.sensorName, { color: theme.colors.text }]}>
          <Text style={styles.boldText}>{item.sensor_nombre}</Text>
        </Text>
        <Text style={[styles.messageContainer, { color: theme.colors.text }]}>
          {item.mensaje}
        </Text>
      </View>
      <Text style={[styles.dateTimeText, { color: theme.colors.text }]}>
        {`${new Date(item.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} hs`}
      </Text>
    </View>
  );

  return (
    <LinearGradient colors={theme.colors.backgroundGradient} style={styles.gradient}>
      <FlatList
        data={userNotifications}
        renderItem={renderNotification}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{ paddingHorizontal: 20, marginVertical: 10}} // Padding en todo el contenedor de la lista
        onEndReached={handleLoadMore} // Cargar más notificaciones al llegar al final
        onEndReachedThreshold={0.5} // Cargar más cuando el usuario esté al 50% del final
        ListFooterComponent={() => isLoadingMore && <ActivityIndicator size="large" color={theme.colors.primary} />} // Indicador de carga al cargar más
        ListEmptyComponent={!isLoading ? <Text style={[styles.notificationText, { color: theme.colors.text }]}>No hay notificaciones.</Text> : null} // Mostrar mensaje si no hay notificaciones
        refreshing={isLoading} // Indicador de carga al refrescar
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing} // Indicador de recarga
            onRefresh={onRefresh} // Función que recarga las notificaciones
            colors={[theme.colors.primary]} // Color del indicador
          />
        }
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1, // Ocupar todo el espacio disponible
    justifyContent: 'center', // Centrar verticalmente
    alignItems: 'center', // Centrar horizontalmente
    height: '100%', // Ocupar toda la altura de la pantalla
  },
  notificationItem: {
    padding: 15,
    borderRadius: 8,
    marginVertical:10,
    position: 'relative',
  },
  notificationContent: {
    marginBottom: 8,
  },
  sensorName: {
    fontSize: 16,
    marginBottom: 4,
  },
  boldText: {
    fontWeight: 'bold',
  },
  messageContainer: {
    fontSize: 15,
  },
  dateTimeText: {
    fontSize: 12,
    fontStyle: 'italic',
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  notificationText: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default NotificationsScreen;
