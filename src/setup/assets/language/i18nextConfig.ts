import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en';
import vn from './vn';

const DEFAULT_LANG = 'vn';

// Định nghĩa hàm trước khi sử dụng
export function getLanguage() {
  return DEFAULT_LANG; 
}

// Khởi tạo
i18next
  .use(initReactI18next)  // Bắt buộc phải có để React không bị lỗi 'undefined'
  .init({
    compatibilityJSON: 'v4', // Thêm dòng này để ổn định hơn
    interpolation: {
      escapeValue: false,
    },
    lng: getLanguage(),
    fallbackLng: DEFAULT_LANG,
    resources: {
      en: { translation: en },
      vn: { translation: vn },
    },
  });

export default i18next;