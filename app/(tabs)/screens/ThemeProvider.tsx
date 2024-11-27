// app/(tabs)/screens/ThemeProvider.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MD3LightTheme as DefaultTheme, MD3DarkTheme as DarkTheme, MD3Theme } from 'react-native-paper';
import { MD3Colors } from 'react-native-paper/lib/typescript/types';

interface CustomTheme extends MD3Theme {
  colors: MD3Colors & {
    border: string;
    backgroundGradient: string[];
    text: string;
    backgroundTo: string;
    chartBackground: string;
    targetBackground: string;
    buttonBackground: string;
    accept: string;
    buttonText: string;
    cancel: string,
    linkText: string;
    alert: string;
  };
}

// Definir temas personalizados con las nuevas propiedades
const CustomLightTheme: CustomTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    backgroundGradient: ['#F0F2F4', '#F5F5F5'],  // Gradiente claro
    background: '#F0F2F4',
    backgroundTo: '#edf1f6',
    chartBackground: '#F0F2F4',
    targetBackground: '#F0F2F4',
    border: '#000',  // Color del borde personalizado
    cancel: 'red',
    accept: 'green',
    text: '#000',
    buttonBackground: '#bb86fc',
    buttonText: '#fff',
    onBackground: '#000',  // Texto
    primary: '#0f131a',
    linkText: 'blue',
    alert: '#FF9800'
  },
};

const CustomDarkTheme: CustomTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    backgroundGradient: ['#000924', '#030123'],  // Gradiente oscuro
    background: '#030123',
    backgroundTo: '#030123',
    chartBackground: '#1b2637',
    targetBackground: '#1d304e',
    border: '#fff6f6',  // Color del borde personalizado
    accept: 'green',
    cancel: 'red',
    text: '#d8e5eb',
    buttonBackground: '#e1f3e0',
    buttonText: '#d8e5eb',
    onBackground: '#d8e5eb',  // Texto
    primary: '#083478',
    linkText: 'blue',
    alert: '#FF9800'
  },
};

interface ThemeContextProps {
  theme: CustomTheme;  // Cambiado a CustomTheme
  toggleTheme: () => void;
  isDarkTheme: boolean;
}

// Crear el contexto de tema
const ThemeContext = createContext<ThemeContextProps>({
  theme: CustomLightTheme, // Tema por defecto
  toggleTheme: () => {},
  isDarkTheme: false,
});

// Proveedor del contexto de tema
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  const theme = isDarkTheme ? CustomDarkTheme : CustomLightTheme;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDarkTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook para acceder al tema
export const useTheme = () => useContext(ThemeContext);
