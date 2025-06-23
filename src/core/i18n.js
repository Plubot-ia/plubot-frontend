import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Ejemplo de recursos de traducción; se recomienda migrar a archivos separados en /locales si el proyecto crece
const resources = {
  es: {
    translation: {
      "bienvenido": "¡Bienvenido a Plubot!",
      "salir": "Salir",
      "guardar": "Guardar",
      "editar": "Editar",
      "eliminar": "Eliminar",
      "cargar": "Cargar",
      "idioma": "Idioma",
      "usuario": "Usuario",
      "contraseña": "Contraseña",
      "error": "Ha ocurrido un error inesperado",
      // ... agrega aquí todas las claves relevantes para la UI principal
    }
  },
  en: {
    translation: {
      "bienvenido": "Welcome to Plubot!",
      "salir": "Logout",
      "guardar": "Save",
      "editar": "Edit",
      "eliminar": "Delete",
      "cargar": "Load",
      "idioma": "Language",
      "usuario": "User",
      "contraseña": "Password",
      "error": "An unexpected error occurred",
      // ... add here all relevant keys for the main UI
    }
  }
};

// Configuración avanzada y profesional para i18next
// - Detección automática de idioma
// - Fallback robusto
// - Pluralización y formatos
// - Extensible a namespaces y backends externos

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'es', // Idioma por defecto
    fallbackLng: ['es', 'en'], // Fallback robusto
    supportedLngs: ['es', 'en'],
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false, // React ya se encarga del escape
      format: (value, format, lng) => {
        if (format === 'uppercase') return value.toUpperCase();
        if (format === 'lowercase') return value.toLowerCase();
        return value;
      },
    },
    pluralSeparator: '_',
    ns: ['translation'], // Namespace por defecto
    defaultNS: 'translation',
    react: {
      useSuspense: true, // Permite loading boundaries
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p'],
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    saveMissing: process.env.NODE_ENV === 'development',
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console

      }
    },
  });

export default i18n;
