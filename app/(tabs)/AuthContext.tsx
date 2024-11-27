import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
interface AuthContextType {
  isAuthenticated: boolean;
  userData: any | null;
  login: (userData: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigation = useNavigation<NavigationProp<any>>();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userData, setUserData] = useState<any | null>(null);

  useEffect(() => {
    const checkUserSession = async () => {
      const userSession = await AsyncStorage.getItem('userSession');
      if (userSession) {
        const userData = JSON.parse(userSession);
        setIsAuthenticated(true);
        setUserData(userData);
      }
    };
    checkUserSession();
  }, []);

  const login = async (userData: any) => {
    setIsAuthenticated(true);
    setUserData(userData);

    // Guardar datos del usuario en AsyncStorage
    await AsyncStorage.setItem('userSession', JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      // Obtener el userId y fcmToken desde AsyncStorage
      const userId = userData.userId;
      const fcmToken = await AsyncStorage.getItem('fcmToken');
  
      if (userId && fcmToken) {
        // Convertir los datos a formato x-www-form-urlencoded
        const formBody = new URLSearchParams();
        formBody.append("user_id", userId);
        formBody.append("token", fcmToken);
  
        // Hacer la solicitud con fetch
        const response = await fetch('https://servicoldingenieria.com/back-end/logout.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formBody.toString(),  // Enviar datos formateados correctamente
        });
  
        // Leer la respuesta
        const responseData = await response.text();
  
        // Verificar la respuesta del backend
        if (response.ok && responseData.includes("Token desactivado exitosamente")) {
  
          // Eliminar solo los datos de sesión
          await AsyncStorage.removeItem('userSession');
          await AsyncStorage.removeItem('hasLoggedIn');
          await AsyncStorage.removeItem('userRole');
          await AsyncStorage.removeItem('userId');
          await AsyncStorage.removeItem('userSensors');
          await AsyncStorage.removeItem('fcmToken');
  
          // Actualizar el estado de autenticación
          setIsAuthenticated(false);
          setUserData(null);
  
          // Navegar a la pantalla de Login
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        } else {
          console.log('Error en la respuesta del backend:', responseData);
          alert('Hubo un problema al cerrar sesión. Inténtalo de nuevo.');
        }
      } else {
        console.log('Error: userId o fcmToken no encontrados en AsyncStorage');
        alert('No se encontró la sesión del usuario.');
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      alert('Ocurrió un error al cerrar sesión.');
    }
  };
      
  return (
    <AuthContext.Provider value={{ isAuthenticated, userData, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
