// screens/HelpScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking } from 'react-native';
import { useTheme } from './ThemeProvider';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from './types';


const HelpScreen: React.FC = () => {
  const { theme } = useTheme();
  const [expandedQuestionIndex, setExpandedQuestionIndex] = useState<number | null>(null);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const faqData = [
    { question: '¿Cómo restablezco mi contraseña?', answer: 'Para restablecer tu contraseña, presiona en el menú de la esquina superior derecha, ve a la sección de Ajustes y selecciona "Cambiar Contraseña". Sigue las instrucciones para crear una nueva contraseña.' },
    { question: '¿Cómo contacto con soporte?', answer: 'Puedes contactar con soporte a través del correo electrónico servicoldsas@gmail.com o por WhatsApp al +5493624049287.' },
    { question: '¿Dónde encuentro la configuración de notificaciones?', answer: 'La configuración de notificaciones se encuentra en la sección de Ajustes, en una sección llamada "Configuración de notificaciones".'},
    // Agrega más preguntas y respuestas aquí
  ];

  const toggleExpand = (index: number) => {
    setExpandedQuestionIndex(expandedQuestionIndex === index ? null : index);
  };

  const handlePressLink = (url: string) => {
    Linking.openURL(url).catch((err) => console.error("No se pudo abrir el enlace", err));
  };
  const handleNavigation = (screenName: any) => {
    navigation.navigate(screenName);
  };

  return (
    <LinearGradient colors={theme.colors.backgroundGradient} style={styles.gradient}>
      <ScrollView style={styles.container}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Preguntas Frecuentes</Text>
        {faqData.map((item, index) => (
          <View key={index} style={styles.faqContainer}>
            <TouchableOpacity
              style={[styles.questionContainer, { backgroundColor: theme.colors.targetBackground }]}
              onPress={() => toggleExpand(index)}
            >
              <Text style={[styles.questionText, { color: theme.colors.text }]}>{item.question}</Text>
            </TouchableOpacity>
            {expandedQuestionIndex === index && (
              <View style={styles.answerContainer}>
                <Text style={[styles.answerText, { color: theme.colors.text }]}>
                  {item.answer.split(/(servicoldsas@gmail.com|\+5493624049287|\Ajustes)/).map((part, i) => {
                    if (part === 'servicoldsas@gmail.com') {
                      return (
                        <Text key={i} style={[styles.linkText]} onPress={() => handlePressLink('mailto:servicoldsas@gmail.com')}>
                          {part}
                        </Text>
                      );
                    } else if (part === '+5493624049287') {
                      return (
                        <Text key={i} style={[styles.linkText]} onPress={() => handlePressLink('https://wa.me/5493624049287')}>
                          {part}
                        </Text>
                      );
                    } else if (part === 'Ajustes') {
                      return (
                        <Text key={i} style={[styles.linkText]} onPress={() => handleNavigation('Settings')}>
                          {part}
                        </Text>
                      );
                    }
                    return <Text key={i}>{part}</Text>;
                  })}
                </Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, marginTop: 5 },
  faqContainer: { marginBottom: 10, fontSize: 16 },
  questionContainer: {
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  questionText: { fontSize: 18, fontWeight: '500' },
  answerContainer: { padding: 15, borderRadius: 10, marginVertical: 5 },
  answerText: { fontSize: 16 },
  linkText: { color: 'blue', textDecorationLine: 'underline', fontStyle: 'italic' }
});

export default HelpScreen;
