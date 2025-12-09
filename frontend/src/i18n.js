import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
// In a larger app, move these to public/locales/{lang}/translation.json
const resources = {
    en: {
        translation: {
            "sidebar": {
                "dashboard": "Dashboard",
                "services": "Services",
                "docker": "Docker Manager",
                "monitoring": "Monitoring",
                "terminal": "SSH Terminal",
                "rdp": "RDP Launcher",
                "topology": "Topology Map",
                "settings": "Settings",
                "logout": "Logout",
                "collapse": "Collapse",
                "expand": "Expand"
            },
            "login": {
                "welcome": "Welcome Back",
                "subtitle": "Sign in to continue to Dallal Dashboard",
                "username": "Username",
                "password": "Password",
                "signin": "Sign In",
                "logging_in": "Logging in...",
                "error_generic": "Login failed. Please check your credentials."
            },
            "services": {
                "title": "Services",
                "subtitle": "Manage and monitor your infrastructure",
                "add_service": "Add Service",
                "loading": "Loading...",
                "online": "Online",
                "offline": "Offline"
            }
        }
    },
    ar: {
        translation: {
            "sidebar": {
                "dashboard": "لوحة المعلومات",
                "services": "الخدمات",
                "docker": "إدارة دوكر",
                "monitoring": "المراقبة",
                "terminal": "محطة SSH",
                "rdp": "مشغل RDP",
                "topology": "خريطة الشبكة",
                "settings": "الإعدادات",
                "logout": "تسجيل الخروج",
                "collapse": "طي",
                "expand": "توسيع"
            },
            "login": {
                "welcome": "مرحباً بعودتك",
                "subtitle": "سجل الدخول للمتابعة إلى لوحة تحكم دلال",
                "username": "اسم المستخدم",
                "password": "كلمة المرور",
                "signin": "تسجيل الدخول",
                "logging_in": "جاري الدخول...",
                "error_generic": "فشل تسجيل الدخول. يرجى التحقق من بيانات الاعتماد."
            },
            "services": {
                "title": "الخدمات",
                "subtitle": "إدارة ومراقبة البنية التحتية الخاصة بك",
                "add_service": "إضافة خدمة",
                "loading": "جاري التحميل...",
                "online": "متصل",
                "offline": "غير متصل"
            }
        }
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false // React already safes from xss
        }
    });

export default i18n;
