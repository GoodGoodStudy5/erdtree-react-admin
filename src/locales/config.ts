import { initReactI18next } from 'react-i18next';
import { getZhLang, getEnLang, getZhLangNamespaces, getEnLangNamespaces } from './utils/helper';
import i18n from 'i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: true,
    fallbackLng: 'zh',
    interpolation: {
      escapeValue: false,
    },
    resources: {
      zh: {
        translation: getZhLang(),
        ...getZhLangNamespaces(),
      },
      en: {
        translation: getEnLang(),
        ...getEnLangNamespaces(),
      },
    },
  });

/**
 * 全局翻译函数. 不依赖组件上下文, 可在 model、工具函数、消息提示里直接调用.
 * 语言切换后的重新取值由 AppRouter 的整树重挂载保证, 见 src/router/AppRouter.tsx
 */
export const $t = i18n.t;

export default i18n;
