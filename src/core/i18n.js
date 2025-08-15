import i18n from 'i18next';
import HttpBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

import logControl from '@/utils/logControl';

// Configuración avanzada y profesional para i18next
// - Detección automática de idioma
// - Fallback robusto
// - Pluralización y formatos
// - Extensible a namespaces y backends externos

i18n
  .use(HttpBackend) // Carga traducciones desde un servidor
  .use(initReactI18next) // Pasa la instancia de i18n a react-i18next
  .init({
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json', // Ruta a los archivos de traducción
    },
    lng: 'es', // Idioma por defecto
    fallbackLng: ['es', 'en'], // Fallback robusto
    supportedLngs: ['es', 'en'],
    debug: false, // 🚀 SILENCIADO: Desactivar logs de debug para evitar ruido en consola
    interpolation: {
      escapeValue: false, // React ya se encarga del escape
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
    saveMissing: import.meta.env.DEV,

    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      if (import.meta.env.DEV) {
        // 🚀 MIGRADO A LOG CONTROL: Silenciar logs de claves faltantes
        logControl.i18n('i18n', `Clave de traducción faltante: [${lng}] ${ns}:${key}`);
      }
      return fallbackValue;
    },
  });

// Registrar formatters personalizados
i18n.services.formatter.add('uppercase', (value) => value.toUpperCase());
i18n.services.formatter.add('lowercase', (value) => value.toLowerCase());

export { default } from 'i18next';
