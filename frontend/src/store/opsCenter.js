import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getAppIcon } from './appIcons';

// Compact app data structure - [name, category, webui_port, extra_ports]
const appsData = [
    // Virtualization & Containers (29 apps)
    ['Proxmox VE', 'virtualization', 8006, '22,5900,3128'],
    ['Portainer', 'virtualization', 9000, '9443,8000'],
    ['Docker Swarm', 'virtualization', null, '2377,7946,4789'],
    ['Kubernetes', 'virtualization', 6443, '2379,2380,10250'],
    ['Rancher', 'virtualization', 80, '443,6443'],
    ['Yacht', 'virtualization', 8000, '22'],
    ['Dockge', 'virtualization', 5001, '22'],
    ['Podman Desktop', 'virtualization', 8888, '22'],
    ['LXC Web Panel', 'virtualization', 5000, '22'],
    ['XCP-ng', 'virtualization', 80, '443,5900,22'],
    ['Xen Orchestra', 'virtualization', 80, '443,22'],
    ['OpenStack', 'virtualization', 80, '5000,8774,9696'],
    ['Nomad', 'virtualization', 4646, '4647,4648'],
    ['Harvester', 'virtualization', 8443, '443,22'],
    ['MicroK8s', 'virtualization', 10443, '16443,25000'],
    ['K3s', 'virtualization', 6443, '10250,8472'],
    ['K9s', 'virtualization', null, '22'],
    ['LazyDocker', 'virtualization', null, '22'],
    ['CasaOS', 'virtualization', 80, '443,22'],
    ['Umbrel', 'virtualization', 80, '22,8333'],
    ['StartOS', 'virtualization', 80, '443,22'],
    ['Cosmos Server', 'virtualization', 80, '443,4242'],
    ['Tipi', 'virtualization', 80, '443'],
    ['RunTipi', 'virtualization', 80, '443,22'],
    ['CapRover', 'virtualization', 80, '443,3000'],
    ['Coolify', 'virtualization', 8000, '22,6001'],
    ['Dokku', 'virtualization', 80, '22,5000'],
    ['Dozzle', 'virtualization', 8080, '22'],
    ['Kasm Workspaces', 'virtualization', 3000, '443'],
    ['Minecraft Server', 'virtualization', null, '25565'],
    ['Valheim Server', 'virtualization', null, '2456'],
    ['Palworld Server', 'virtualization', null, '8211'],
    ['Pterodactyl', 'virtualization', 80, '443,2022'],

    // Infrastructure Management (80+ apps)
    ['Guacamole', 'infrastructure', 8080, '8443,4822'],
    ['RustDesk', 'infrastructure', 21114, '21115,21116,21117'],
    ['MeshCentral', 'infrastructure', 80, '443,4433'],
    ['Remotely', 'infrastructure', 5000, '443'],
    ['Webmin', 'infrastructure', 10000, '22'],
    ['Cockpit', 'infrastructure', 9090, '22'],
    ['Ajenti', 'infrastructure', 8000, '22'],
    ['TinyPilot', 'infrastructure', 80, '443'],
    ['PiKVM', 'infrastructure', 80, '443,5900'],
    ['Homepage', 'infrastructure', 3000, '80'],
    ['Homarr', 'infrastructure', 7575, '80'],
    ['Heimdall', 'infrastructure', 80, '443'],
    ['Dashy', 'infrastructure', 8080, '4000'],
    ['Organizr', 'infrastructure', 80, '443'],
    ['Flame', 'infrastructure', 5005, '80'],
    ['Fenrus', 'infrastructure', 3000, '80'],
    ['Glance', 'infrastructure', 8080, '80'],
    ['OliveTin', 'infrastructure', 1337, '22'],
    ['Rundeck', 'infrastructure', 4440, '4443'],
    ['Ansible Semaphore', 'infrastructure', 3000, '22'],
    ['AWX', 'infrastructure', 80, '443'],
    ['IT-Tools', 'infrastructure', 80, '443'],
    ['CyberChef', 'infrastructure', 80, '8000'],
    ['Stirling-PDF', 'infrastructure', 8080, '80'],
    ['Paperless-ngx', 'infrastructure', 8000, '80'],
    ['Wiki.js', 'infrastructure', 3000, '80'],
    ['BookStack', 'infrastructure', 80, '443'],
    ['DokuWiki', 'infrastructure', 80, '443'],
    ['Joplin Server', 'infrastructure', 22300, '80'],
    ['Trilium Notes', 'infrastructure', 8080, '80'],
    ['Outline', 'infrastructure', 3000, '80'],
    ['Snipe-IT', 'infrastructure', 80, '443'],
    ['NetBox', 'infrastructure', 8000, '80'],
    ['PHPIPAM', 'infrastructure', 80, '443'],
    ['RackTables', 'infrastructure', 80, '443'],
    ['Cachet', 'infrastructure', 8000, '80'],
    ['Statping', 'infrastructure', 8080, '80'],
    ['Upptime', 'infrastructure', 80, '443'],
    ['Code-Server', 'infrastructure', 8080, '80'],
    ['JupyterHub', 'infrastructure', 8000, '80'],
    ['Ghost', 'infrastructure', 2368, '80'],
    ['WordPress', 'infrastructure', 80, '443'],
    ['Mattermost', 'infrastructure', 8065, '80'],
    ['Rocket.Chat', 'infrastructure', 3000, '80'],

    // Network Monitoring (28 apps)
    ['Uptime Kuma', 'monitoring', 3001, '80'],
    ['Nagios', 'monitoring', 80, '5666'],
    ['Zabbix', 'monitoring', 80, '10050,10051'],
    ['LibreNMS', 'monitoring', 80, '443,161'],
    ['Observium', 'monitoring', 80, '443,161'],
    ['Checkmk', 'monitoring', 5000, '6556'],
    ['Icinga 2', 'monitoring', 80, '5665'],
    ['Prometheus', 'monitoring', 9090, '9100'],
    ['Grafana', 'monitoring', 3000, '80'],
    ['Netdata', 'monitoring', 19999, '80'],
    ['Glances', 'monitoring', 61208, '80'],
    ['Beszel', 'monitoring', 45876, '80'],
    ['Cacti', 'monitoring', 80, '161,162'],
    ['Smokeping', 'monitoring', 80, '443'],
    ['Pingvin', 'monitoring', 3000, '80'],
    ['Gatus', 'monitoring', 8080, '80'],
    ['Blackbox Exporter', 'monitoring', 9115, '80'],
    ['Node Exporter', 'monitoring', 9100, '80'],
    ['Cadvisor', 'monitoring', 8080, '80'],
    ['InfluxDB', 'monitoring', 8086, '8088'],
    ['VictoriaMetrics', 'monitoring', 8428, '2003,4242'],
    ['Loki', 'monitoring', 3100, '9096'],
    ['Graylog', 'monitoring', 9000, '12201,514'],
    ['ELK Stack', 'monitoring', 5601, '9200,5044'],
    ['Splunk', 'monitoring', 8000, '8089,9997'],

    // Security & Firewall (60+ apps)
    ['Wazuh', 'security', 55000, '1514,1515'],
    ['Security Onion', 'security', 443, '22'],
    ['PfSense', 'security', 80, '443,22'],
    ['OPNsense', 'security', 80, '443,22'],
    ['OpenWrt', 'security', 80, '443,22'],
    ['Pi-hole', 'security', 80, '53,443'],
    ['AdGuard Home', 'security', 80, '53,3000,853'],
    ['Technitium', 'security', 5380, '53,853'],
    ['Nginx Proxy Manager', 'security', 81, '80,443'],
    ['Traefik', 'security', 8080, '80,443'],
    ['Caddy', 'security', 80, '443,2019'],
    ['Haproxy', 'security', 80, '443,1936'],
    ['SWAG', 'security', 80, '443'],
    ['Authelia', 'security', 9091, '80'],
    ['Authentik', 'security', 9000, '9443,389'],
    ['Keycloak', 'security', 8080, '8443'],
    ['Vaultwarden', 'security', 80, '443,3012'],
    ['Bitwarden', 'security', 80, '443'],
    ['Passbolt', 'security', 80, '443'],
    ['WireGuard Easy', 'security', 51821, '51820'],
    ['OpenVPN AS', 'security', 943, '1194'],
    ['Tailscale', 'security', 8088, '41641'],
    ['Headscale', 'security', 8080, '80'],
    ['Netbird', 'security', 33073, '80'],
    ['Firezone', 'security', 80, '443,51820'],
    ['Zerotier', 'security', 9993, '9993'],
    ['CrowdSec', 'security', 8080, '6060'],
    ['Frigate', 'security', 5000, '1935,8554'],
    ['Blue Iris', 'security', 81, '80'],
    ['ZoneMinder', 'security', 80, '443'],
    ['Shinobi', 'security', 8080, '80'],
    ['Agent DVR', 'security', 8090, '80'],
    ['MotionEye', 'security', 8765, '8081'],

    // Data Storage & Backup (50+ apps)
    ['TrueNAS Scale', 'storage', 80, '443,22,445'],
    ['TrueNAS Core', 'storage', 80, '443,22,445'],
    ['Unraid', 'storage', 80, '443,22,445'],
    ['OpenMediaVault', 'storage', 80, '443,22,445'],
    ['Synology DSM', 'storage', 5000, '5001,22'],
    ['Nextcloud', 'storage', 80, '443'],
    ['OwnCloud', 'storage', 80, '443'],
    ['Seafile', 'storage', 8000, '8082'],
    ['FileBrowser', 'storage', 8080, '80'],
    ['Syncthing', 'storage', 8384, '22000'],
    ['Resilio Sync', 'storage', 8888, '55555'],
    ['Duplicati', 'storage', 8200, '80'],
    ['Duplicacy', 'storage', 3875, '80'],
    ['UrBackup', 'storage', 55414, '35621,35623'],
    ['Kopia', 'storage', 51515, '80'],
    ['MinIO', 'storage', 9001, '9000'],
    ['Ceph', 'storage', 8443, '6789,3300'],
    ['Longhorn', 'storage', 80, '9500'],
    ['Plex', 'storage', 32400, '32469,1900,5353'],
    ['Jellyfin', 'storage', 8096, '8920'],
    ['Emby', 'storage', 8096, '8920'],
    ['Navidrome', 'storage', 4533, '80'],
    ['Audiobookshelf', 'storage', 13378, '80'],
    ['Immich', 'storage', 2283, '80'],
    ['PhotoPrism', 'storage', 2342, '80'],
    ['LibrePhotos', 'storage', 3000, '80'],
    ['Lychee', 'storage', 80, '443'],
    ['Piwigo', 'storage', 80, '443'],
    ['MariaDB', 'storage', 3306, '3306'],
    ['PostgreSQL', 'storage', 5432, '5432'],
    ['MySQL', 'storage', 3306, '3306'],
    ['Redis', 'storage', 6379, '6379'],
    ['MongoDB', 'storage', 27017, '27017'],
    ['Adminer', 'storage', 8080, '80'],
    ['phpMyAdmin', 'storage', 80, '443'],
    ['pgAdmin', 'storage', 80, '443'],

    // Automation & Orchestration (80+ apps)
    ['Home Assistant', 'automation', 8123, '80'],
    ['Node-RED', 'automation', 1880, '80'],
    ['n8n', 'automation', 5678, '80'],
    ['Huginn', 'automation', 3000, '80'],
    ['OpenHAB', 'automation', 8080, '8443,5007'],
    ['Domoticz', 'automation', 8080, '443,6144'],
    ['ESPHome', 'automation', 6052, '80'],
    ['Mosquitto', 'automation', 1883, '9001'],
    ['EMQX', 'automation', 18083, '1883,8083'],
    ['Zigbee2MQTT', 'automation', 8080, '1883'],
    ['Z-Wave JS UI', 'automation', 8091, '3000'],
    ['Homebridge', 'automation', 8581, '51826'],
    ['GitLab', 'automation', 80, '443,22,5005'],
    ['Gitea', 'automation', 3000, '22'],
    ['Forgejo', 'automation', 3000, '22'],
    ['Gogs', 'automation', 3000, '22'],
    ['Jenkins', 'automation', 8080, '50000'],
    ['Drone', 'automation', 80, '443'],
    ['ArgoCD', 'automation', 80, '443'],
    ['Radarr', 'automation', 7878, '80'],
    ['Sonarr', 'automation', 8989, '80'],
    ['Lidarr', 'automation', 8686, '80'],
    ['Readarr', 'automation', 8787, '80'],
    ['Bazarr', 'automation', 6767, '80'],
    ['Prowlarr', 'automation', 9696, '80'],
    ['Whisparr', 'automation', 6969, '80'],
    ['Jackett', 'automation', 9117, '80'],
    ['Overseerr', 'automation', 5055, '80'],
    ['Jellyseerr', 'automation', 5055, '80'],
    ['Ombi', 'automation', 3579, '80'],
    ['Tdarr', 'automation', 8265, '8266'],
    ['Unmanic', 'automation', 8888, '80'],
    ['FileFlows', 'automation', 5000, '80'],
    ['SABnzbd', 'automation', 8080, '119'],
    ['NZBGet', 'automation', 6789, '119'],
    ['qBittorrent', 'automation', 8080, '6881'],
    ['Transmission', 'automation', 9091, '51413'],
    ['Deluge', 'automation', 8112, '58846'],
    ['rTorrent', 'automation', 80, '5000'],
    ['Flood', 'automation', 3000, '80'],
    ['Cloudflare Tunnel', 'automation', null, '7844'],

    // Performance Analytics (50+ apps)
    ['Ollama', 'analytics', 11434, '80'],
    ['Open WebUI', 'analytics', 3000, '8080'],
    ['LocalAI', 'analytics', 8080, '80'],
    ['Stable Diffusion', 'analytics', 7860, '80'],
    ['Tautulli', 'analytics', 8181, '80'],
    ['Varys', 'analytics', 8182, '80'],
    ['GoAccess', 'analytics', 7890, '80'],
    ['Plausible', 'analytics', 8000, '80'],
    ['Matomo', 'analytics', 80, '443'],
    ['Umami', 'analytics', 3000, '80'],
    ['PostHog', 'analytics', 8000, '80'],
    ['Sentry', 'analytics', 9000, '80'],
    ['Speedtest Tracker', 'analytics', 80, '443'],
    ['Librespeed', 'analytics', 80, '443'],
    ['NTOPNG', 'analytics', 3000, '2055'],
    ['Arkime', 'analytics', 8005, '8081'],
    ['Malcolm', 'analytics', 443, '9200'],
    ['Healthchecks', 'analytics', 8000, '25'],
    ['ChangeDetection', 'analytics', 5000, '80'],
    ['Selenium', 'analytics', 4444, '5900'],
    ['K6', 'analytics', 6565, '80'],
    ['Locust', 'analytics', 8089, '5557'],
    ['JMeter', 'analytics', 1099, '4445'],
    ['Pyroscope', 'analytics', 4040, '80'],
    ['Parca', 'analytics', 7070, '80'],
    ['Signoz', 'analytics', 3301, '4317,4318'],
    ['Jaeger', 'analytics', 16686, '14250,14268'],
    ['Zipkin', 'analytics', 9411, '9410'],
    ['Tempo', 'analytics', 3200, '4317'],
    ['Mimir', 'analytics', 9009, '80'],
    ['Thanos', 'analytics', 10902, '10901'],
    ['Fluentd', 'analytics', 24224, '9880'],
    ['Fluent Bit', 'analytics', 2020, '24224'],
    ['Vector', 'analytics', 8686, '9000'],
    ['Logstash', 'analytics', 9600, '5044']
];

// Generate app objects from compact data
const colors = ['#e57000', '#13bef9', '#1ca78f', '#27ae60', '#3498db', '#9b59b6', '#e74c3c', '#1abc9c', '#f39c12', '#34495e', '#5cdd8b', '#ff8c00', '#96060c', '#68bc71', '#009639', '#24a1c1', '#4a86e8', '#175ddc', '#88171a', '#1e293b', '#0095d5', '#0082c9', '#4250AF', '#6FB735', '#41b883', '#ed801f', '#6b46ff', '#41bdf5', '#8f0000', '#ea4b71', '#ffc230', '#4e9cef', '#a855f7', '#3a4e65', '#3a88fe', '#ff7f00', '#5850ec', '#fd7e14', '#007bff', '#60d0e4'];

export const availableApps = appsData.map((app, i) => {
    const [name, category, webuiPort, extraPorts] = app;
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const protocol = (webuiPort === 443 || webuiPort === 8443) ? 'https' : 'http';
    const urlSuffix = (webuiPort && webuiPort !== 80 && webuiPort !== 443) ? `:${webuiPort}` : '';
    const appIcon = getAppIcon(id, category);

    return {
        id,
        name,
        category,
        url: webuiPort ? `${protocol}://${id}.local${urlSuffix}` : `http://${id}.local`,
        webUiPort: webuiPort,
        extraPorts: extraPorts ? extraPorts.split(',') : [],
        defaultSize: webuiPort ? 'half' : 'third',
        scale: 0.85,
        color: colors[i % colors.length],
        icon: appIcon,
        iconIsUrl: typeof appIcon === 'string' && appIcon.startsWith('http')
    };
});

// Ops Center Store
export const useOpsCenterStore = create(
    persist(
        (set, get) => ({
            activeTab: 'infrastructure',
            setActiveTab: (tab) => set({ activeTab: tab }),
            openIframes: [],

            addIframe: (appId) => {
                const app = availableApps.find(a => a.id === appId);
                if (!app) return;
                const existing = get().openIframes.find(i => i.appId === appId);
                if (existing) return;

                set({
                    openIframes: [...get().openIframes, {
                        id: `${appId}-${Date.now()}`,
                        appId: app.id,
                        url: app.url,
                        size: app.defaultSize,
                        scale: app.scale,
                        expanded: true,
                        name: app.name,
                        color: app.color
                    }]
                });
            },

            // Add app with custom configuration from wizard
            addConfiguredApp: (config) => {
                const existing = get().openIframes.find(i =>
                    i.appId === config.appId && i.url === config.url
                );
                if (existing) return;

                const newIframe = {
                    id: `${config.appId}-${Date.now()}`,
                    appId: config.appId,
                    url: config.url,
                    size: config.size,
                    scale: config.scale,
                    expanded: config.expanded,
                    name: config.name,
                    color: config.color
                };

                set({ openIframes: [...get().openIframes, newIframe] });

                // Set active tab to the category of the added app
                if (config.category) {
                    set({ activeTab: config.category });
                }
            },

            removeIframe: (id) => set({ openIframes: get().openIframes.filter(i => i.id !== id) }),
            toggleIframeExpanded: (id) => set({ openIframes: get().openIframes.map(i => i.id === id ? { ...i, expanded: !i.expanded } : i) }),
            updateIframeSize: (id, size) => set({ openIframes: get().openIframes.map(i => i.id === id ? { ...i, size } : i) }),
            clearAllIframes: () => set({ openIframes: [] }),
            focusMode: false,
            setFocusMode: (enabled) => set({ focusMode: enabled }),
            showAppDirectory: true,
            toggleAppDirectory: () => set({ showAppDirectory: !get().showAppDirectory })
        }),
        { name: 'ops-center-storage', partialize: (state) => ({ activeTab: state.activeTab, openIframes: state.openIframes }) }
    )
);
