import { Link, type Href } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import { type ComponentProps } from 'react';
import { Platform } from 'react-native';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: Href<string | object> };

export function ExternalLink({ href, ...rest }: Props) {
  return (
    <Link
      target="_blank"
      {...rest}
      href={href}
      onPress={async (event) => {
        if (Platform.OS !== 'web') {
          event.preventDefault();  // Evita el comportamiento predeterminado de abrir en el navegador por defecto.
          await openBrowserAsync(href as string);  // Abre el enlace en un navegador dentro de la aplicación.
        }
      }}
    />
  );
}
