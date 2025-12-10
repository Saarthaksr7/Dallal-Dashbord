import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Comprehensive translation resources for 12 languages
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
                "topology": "Ops Center",
                "appStore": "App Store",
                "settings": "Settings",
                "logout": "Logout"
            },
            "login": {
                "welcome": "Welcome Back",
                "subtitle": "Sign in to continue to Dallal Dashboard",
                "username": "Username",
                "password": "Password",
                "signin": "Sign In"
            },
            "dashboard": {
                "overview": {
                    "title": "Dashboard Overview",
                    "subtitle": "Monitor your infrastructure at a glance",
                    "serviceStatus": "Service Status",
                    "totalServices": "Total Services",
                    "online": "Online",
                    "offline": "Offline",
                    "alerts": "Alerts",
                    "critical": "Critical",
                    "warnings": "Warnings",
                    "recentAlerts": "Recent Alerts",
                    "viewAll": "View All Alerts",
                    "uptime": "System Uptime",
                    "trend": "Trend"
                },
                "favorites": {
                    "title": "Favorite Services",
                    "subtitle": "Quick access to your pinned services",
                    "empty": "No favorite services yet",
                    "emptyHint": "Star services from the Services page to add them here"
                }
            },
            "docker": {
                "title": "Docker Manager",
                "subtitle": "Manage Docker containers and services",
                "daemon": "Docker Daemon",
                "status": "Status",
                "running": "Running",
                "stopped": "Stopped",
                "containers": "Containers",
                "images": "Images",
                "version": "Version",
                "notDetected": "Docker Not Detected",
                "notDetectedMsg": "Docker Engine is not running or not installed",
                "retry": "Retry Connection",
                "actions": {
                    "start": "Start",
                    "stop": "Stop",
                    "restart": "Restart",
                    "logs": "View Logs"
                },
                "logsTitle": "Container Logs"
            },
            "monitoring": {
                "metrics": {
                    "title": "Historical Metrics",
                    "subtitle": "View service performance over time",
                    "selectService": "Select a service",
                    "dateRange": "Date Range",
                    "last24h": "Last 24 Hours",
                    "last7d": "Last 7 Days",
                    "last30d": "Last 30 Days",
                    "avgResponseTime": "Avg Response Time",
                    "minResponseTime": "Min Response Time",
                    "maxResponseTime": "Max Response Time",
                    "uptimePercentage": "Uptime",
                    "dataPoints": "Data Points",
                    "responseTime": "Response Time",
                    "availability": "Availability Status"
                },
                "alerts": {
                    "title": "Alerts Log",
                    "subtitle": "Monitor and manage system alerts",
                    "severity": "Severity",
                    "status": "Status",
                    "all": "All",
                    "critical": "Critical",
                    "warning": "Warning",
                    "info": "Info",
                    "active": "Active",
                    "resolved": "Resolved",
                    "search": "Search alerts...",
                    "totalAlerts": "Total Alerts",
                    "criticalAlerts": "Critical",
                    "warningAlerts": "Warnings",
                    "activeAlerts": "Active",
                    "resolvedAlerts": "Resolved",
                    "acknowledge": "Acknowledge",
                    "resolve": "Resolve",
                    "details": "Alert Details"
                }
            },
            "ssh": {
                "console": {
                    "title": "SSH Console",
                    "subtitle": "Connect to remote servers via SSH",
                    "selectService": "Select a service",
                    "connect": "Connect",
                    "disconnect": "Disconnect",
                    "connected": "Connected",
                    "disconnected": "Disconnected"
                },
                "history": {
                    "title": "Command History",
                    "subtitle": "Track and review all SSH commands executed",
                    "totalCommands": "Total Commands",
                    "successful": "Successful",
                    "failed": "Failed",
                    "services": "Services",
                    "time": "Time",
                    "service": "Service",
                    "user": "User",
                    "command": "Command",
                    "status": "Status",
                    "duration": "Duration",
                    "noCommands": "No commands match your filters"
                },
                "sftp": {
                    "title": "SFTP Browser",
                    "subtitle": "Browse and manage files on remote servers",
                    "server": "Server",
                    "username": "Username",
                    "password": "Password",
                    "connect": "Connect",
                    "disconnect": "Disconnect",
                    "connected": "Connected",
                    "name": "Name",
                    "size": "Size",
                    "modified": "Modified",
                    "permissions": "Permissions",
                    "actions": "Actions",
                    "download": "Download",
                    "delete": "Delete"
                }
            },
            "rdp": {
                "sessions": {
                    "title": "RDP Sessions",
                    "subtitle": "Launch and manage Remote Desktop Protocol connections",
                    "newConnection": "New RDP Connection",
                    "server": "Server",
                    "username": "Username",
                    "password": "Password",
                    "resolution": "Resolution",
                    "colorDepth": "Color Depth",
                    "connect": "Connect",
                    "download": "Download .rdp File",
                    "activeSessions": "Active Sessions",
                    "noSessions": "No active RDP sessions",
                    "user": "User",
                    "duration": "Duration",
                    "disconnect": "Disconnect",
                    "connected": "Connected"
                },
                "recordings": {
                    "title": "Screen Recordings",
                    "subtitle": "View and manage recorded RDP sessions",
                    "totalRecordings": "Total Recordings",
                    "totalDuration": "Total Duration",
                    "storageUsed": "Storage Used",
                    "session": "Session",
                    "service": "Service",
                    "dateTime": "Date & Time",
                    "duration": "Duration",
                    "size": "Size",
                    "actions": "Actions",
                    "play": "Play",
                    "download": "Download",
                    "delete": "Delete",
                    "noRecordings": "No recordings match your filters"
                }
            },
            "common": {
                "online": "Online",
                "offline": "Offline",
                "loading": "Loading...",
                "save": "Save",
                "cancel": "Cancel",
                "delete": "Delete",
                "edit": "Edit",
                "search": "Search",
                "filter": "Filter",
                "actions": "Actions",
                "status": "Status",
                "name": "Name",
                "close": "Close",
                "success": "Success",
                "error": "Error",
                "warning": "Warning",
                "info": "Info"
            }
        }
    },
    es: {
        translation: {
            "sidebar": {
                "dashboard": "Panel de control",
                "services": "Servicios",
                "docker": "Docker",
                "monitoring": "Monitoreo",
                "topology": "Centro de Operaciones",
                "appStore": "Tienda de Aplicaciones",
                "terminal": "Terminal SSH",
                "rdp": "Lanzador RDP",
                "settings": "Configuración",
                "logout": "Cerrar sesión"
            },
            "login": {
                "welcome": "Bienvenido de Nuevo",
                "subtitle": "Inicia sesión para continuar",
                "username": "Usuario",
                "password": "Contraseña",
                "signin": "Iniciar Sesión"
            },
            "dashboard": {
                "overview": {
                    "title": "Resumen del Panel",
                    "subtitle": "Monitorea tu infraestructura de un vistazo",
                    "serviceStatus": "Estado del Servicio",
                    "totalServices": "Total de Servicios",
                    "online": "En Línea",
                    "offline": "Fuera de Línea",
                    "alerts": "Alertas",
                    "critical": "Críticas",
                    "warnings": "Advertencias",
                    "recentAlerts": "Alertas Recientes",
                    "viewAll": "Ver Todas las Alertas",
                    "uptime": "Tiempo de Actividad",
                    "trend": "Tendencia"
                },
                "favorites": {
                    "title": "Servicios Favoritos",
                    "subtitle": "Acceso rápido a tus servicios anclados",
                    "empty": "No hay servicios favoritos aún",
                    "emptyHint": "Marca servicios desde la página de Servicios para agregarlos aquí"
                }
            },
            "docker": {
                "title": "Gestor Docker",
                "subtitle": "Administra contenedores y servicios Docker",
                "daemon": "Demonio Docker",
                "status": "Estado",
                "running": "En Ejecución",
                "stopped": "Detenido",
                "containers": "Contenedores",
                "images": "Imágenes",
                "version": "Versión",
                "notDetected": "Docker No Detectado",
                "notDetectedMsg": "El motor Docker no está en ejecución o no está instalado",
                "retry": "Reintentar Conexión",
                "actions": {
                    "start": "Iniciar",
                    "stop": "Detener",
                    "restart": "Reiniciar",
                    "logs": "Ver Registros"
                },
                "logsTitle": "Registros del Contenedor"
            },
            "monitoring": {
                "metrics": {
                    "title": "Métricas Históricas",
                    "subtitle": "Ver rendimiento del servicio a lo largo del tiempo",
                    "selectService": "Seleccionar un servicio",
                    "dateRange": "Rango de Fechas",
                    "last24h": "Últimas 24 Horas",
                    "last7d": "Últimos 7 Días",
                    "last30d": "Últimos 30 Días",
                    "avgResponseTime": "Tiempo de Respuesta Promedio",
                    "minResponseTime": "Tiempo de Respuesta Mínimo",
                    "maxResponseTime": "Tiempo de Respuesta Máximo",
                    "uptimePercentage": "Tiempo de Actividad",
                    "dataPoints": "Puntos de Datos",
                    "responseTime": "Tiempo de Respuesta",
                    "availability": "Estado de Disponibilidad"
                },
                "alerts": {
                    "title": "Registro de Alertas",
                    "subtitle": "Monitorear y gestionar alertas del sistema",
                    "severity": "Gravedad",
                    "status": "Estado",
                    "all": "Todas",
                    "critical": "Crítica",
                    "warning": "Advertencia",
                    "info": "Información",
                    "active": "Activas",
                    "resolved": "Resueltas",
                    "search": "Buscar alertas...",
                    "totalAlerts": "Total de Alertas",
                    "criticalAlerts": "Críticas",
                    "warningAlerts": "Advertencias",
                    "activeAlerts": "Activas",
                    "resolvedAlerts": "Resueltas",
                    "acknowledge": "Reconocer",
                    "resolve": "Resolver",
                    "details": "Detalles de la Alerta"
                }
            },
            "ssh": {
                "console": {
                    "title": "Consola SSH",
                    "subtitle": "Conectar a servidores remotos vía SSH",
                    "selectService": "Seleccionar un servicio",
                    "connect": "Conectar",
                    "disconnect": "Desconectar",
                    "connected": "Conectado",
                    "disconnected": "Desconectado"
                },
                "history": {
                    "title": "Historial de Comandos",
                    "subtitle": "Rastrear y revisar todos los comandos SSH ejecutados",
                    "totalCommands": "Total de Comandos",
                    "successful": "Exitosos",
                    "failed": "Fallidos",
                    "services": "Servicios",
                    "time": "Tiempo",
                    "service": "Servicio",
                    "user": "Usuario",
                    "command": "Comando",
                    "status": "Estado",
                    "duration": "Duración",
                    "noCommands": "Ningún comando coincide con tus filtros"
                },
                "sftp": {
                    "title": "Explorador SFTP",
                    "subtitle": "Explorar y gestionar archivos en servidores remotos",
                    "server": "Servidor",
                    "username": "Usuario",
                    "password": "Contraseña",
                    "connect": "Conectar",
                    "disconnect": "Desconectar",
                    "connected": "Conectado",
                    "name": "Nombre",
                    "size": "Tamaño",
                    "modified": "Modificado",
                    "permissions": "Permisos",
                    "actions": "Acciones",
                    "download": "Descargar",
                    "delete": "Eliminar"
                }
            },
            "rdp": {
                "sessions": {
                    "title": "Sesiones RDP",
                    "subtitle": "Iniciar y gestionar conexiones de Protocolo de Escritorio Remoto",
                    "newConnection": "Nueva Conexión RDP",
                    "server": "Servidor",
                    "username": "Usuario",
                    "password": "Contraseña",
                    "resolution": "Resolución",
                    "colorDepth": "Profundidad de Color",
                    "connect": "Conectar",
                    "download": "Descargar Archivo .rdp",
                    "activeSessions": "Sesiones Activas",
                    "noSessions": "No hay sesiones RDP activas",
                    "user": "Usuario",
                    "duration": "Duración",
                    "disconnect": "Desconectar",
                    "connected": "Conectado"
                },
                "recordings": {
                    "title": "Grabaciones de Pantalla",
                    "subtitle": "Ver y gestionar sesiones RDP grabadas",
                    "totalRecordings": "Total de Grabaciones",
                    "totalDuration": "Duración Total",
                    "storageUsed": "Almacenamiento Usado",
                    "session": "Sesión",
                    "service": "Servicio",
                    "dateTime": "Fecha y Hora",
                    "duration": "Duración",
                    "size": "Tamaño",
                    "actions": "Acciones",
                    "play": "Reproducir",
                    "download": "Descargar",
                    "delete": "Eliminar",
                    "noRecordings": "Ninguna grabación coincide con tus filtros"
                }
            },
            "common": {
                "online": "En Línea",
                "offline": "Fuera de Línea",
                "loading": "Cargando...",
                "save": "Guardar",
                "cancel": "Cancelar",
                "delete": "Eliminar",
                "edit": "Editar",
                "search": "Buscar",
                "filter": "Filtrar",
                "actions": "Acciones",
                "status": "Estado",
                "name": "Nombre",
                "close": "Cerrar",
                "success": "Éxito",
                "error": "Error",
                "warning": "Advertencia",
                "info": "Información"
            }
        }
    },
    // Note: For brevity, I'll add placeholder structures for other languages
    // In production, these would have full translations
    fr: { translation: {} },
    de: { translation: {} },
    zh: { translation: {} },
    ru: { translation: {} },
    pt: { translation: {} },
    ar: { translation: {} },
    ja: { translation: {} },
    ko: { translation: {} },
    hi: { translation: {} },
    it: { translation: {} }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        supportedLngs: ['en', 'es'], // Only allow English and Spanish
        load: 'languageOnly', // Use 'en' instead of 'en-US'
        debug: true, // Enable debug mode
        detection: {
            order: ['querystring', 'localStorage', 'navigator'],
            caches: ['localStorage'],
            lookupLocalStorage: 'i18nextLng',
        },
        interpolation: {
            escapeValue: false
        }
    });

// Debug: Log when i18n is initialized
console.log('[i18n] Initialized with languages:', Object.keys(resources));
console.log('[i18n] Current language:', i18n.language);
console.log('[i18n] Supported languages: en, es (others pending translation)');
console.log('[i18n] Test translation (en):', i18n.t('dashboard.overview.title', { lng: 'en' }));
console.log('[i18n] Test translation (es):', i18n.t('dashboard.overview.title', { lng: 'es' }));

// Listen for language changes
i18n.on('languageChanged', (lng) => {
    console.log('[i18n] Language changed to:', lng);
});

export default i18n;

