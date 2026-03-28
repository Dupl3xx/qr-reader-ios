import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import cs from './locales/cs';
import en from './locales/en';
import sk from './locales/sk';
import de from './locales/de';
import pl from './locales/pl';

const resources = {
  cs: { translation: cs },
  en: { translation: en },
  sk: { translation: sk },
  de: { translation: de },
  pl: { translation: pl },
};

const deviceLanguage = Localization.getLocales()[0]?.languageCode ?? 'en';
const supportedLang = Object.keys(resources).includes(deviceLanguage) ? deviceLanguage : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: supportedLang,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n;
export const SUPPORTED_LANGUAGES = [
  { code: 'cs', label: 'Čeština', flag: '🇨🇿' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'sk', label: 'Slovenčina', flag: '🇸🇰' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'pl', label: 'Polski', flag: '🇵🇱' },
];
