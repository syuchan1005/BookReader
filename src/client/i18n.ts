// @ts-ignore
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      loadMore: 'Load More',
    },
  },
  ja: {
    translation: {
      loadMore: '続きを取得',
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: navigator.language,
    fallbackLng: 'en',
    keySeparator: false,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
