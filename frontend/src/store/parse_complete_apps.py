import re

# Parse the complete app list from user
apps_raw = """
Proxmox VE = webui ports-8006, extra ports-22,5900,3128 = Virtualization & Containers
Portainer = webui ports-9000, extra ports-9443,8000 = Virtualization & Containers
Docker Swarm = webui ports-none, extra ports-2377,7946,4789 = Virtualization & Containers
Kubernetes = webui ports-6443, extra ports-2379,2380,10250 = Virtualization & Containers
Rancher = webui ports-80, extra ports-443,6443 = Virtualization & Containers
Yacht = webui ports-8000, extra ports-22 = Virtualization & Containers
Dockge = webui ports-5001, extra ports-22 = Virtualization & Containers
Podman Desktop = webui ports-8888, extra ports-22 = Virtualization & Containers
LXC Web Panel = webui ports-5000, extra ports-22 = Virtualization & Containers
XCP-ng = webui ports-80, extra ports-443,5900,22 = Virtualization & Containers
Xen Orchestra = webui ports-80, extra ports-443,22 = Virtualization & Containers
OpenStack = webui ports-80, extra ports-5000,8774,9696 = Virtualization & Containers
Nomad = webui ports-4646, extra ports-4647,4648 = Virtualization & Containers
Harvester = webui ports-8443, extra ports-443,22 = Virtualization & Containers
MicroK8s = webui ports-10443, extra ports-16443,25000 = Virtualization & Containers
K3s = webui ports-6443, extra ports-10250,8472 = Virtualization & Containers
K9s = webui ports-none, extra ports-22 = Virtualization & Containers
LazyDocker = webui ports-none, extra ports-22 = Virtualization & Containers
CasaOS = webui ports-80, extra ports-443,22 = Virtualization & Containers
Umbrel = webui ports-80, extra ports-22,8333 = Virtualization & Containers
StartOS = webui ports-80, extra ports-443,22 = Virtualization & Containers
Cosmos Server = webui ports-80, extra ports-443,4242 = Virtualization & Containers
Tipi = webui ports-80, extra ports-443 = Virtualization & Containers
RunTipi = webui ports-80, extra ports-443,22 = Virtualization & Containers
CapRover = webui ports-80, extra ports-443,3000 = Virtualization & Containers
Coolify = webui ports-8000, extra ports-22,6001 = Virtualization & Containers
Dokku = webui ports-80, extra ports-22,5000 = Virtualization & Containers
Dozzle = webui ports-8080, extra ports-22 = Virtualization & Containers
Kasm Workspaces = webui ports-3000, extra ports-443 = Virtualization & Containers
Guacamole = webui ports-8080, extra ports-8443,4822 = Infrastructure Management
RustDesk = webui ports-21114, extra ports-21115,21116,21117 = Infrastructure Management
MeshCentral = webui ports-80, extra ports-443,4433 = Infrastructure Management
Remotely = webui ports-5000, extra ports-443 = Infrastructure Management
Webmin = webui ports-10000, extra ports-22 = Infrastructure Management
Cockpit = webui ports-9090, extra ports-22 = Infrastructure Management
Ajenti = webui ports-8000, extra ports-22 = Infrastructure Management
TinyPilot = webui ports-80, extra ports-443 = Infrastructure Management
PiKVM = webui ports-80, extra ports-443,5900 = Infrastructure Management
Blinkist = webui ports-80, extra ports-22 = Infrastructure Management
Homepage = webui ports-3000, extra ports-80 = Infrastructure Management
Homarr = webui ports-7575, extra ports-80 = Infrastructure Management
Heimdall = webui ports-80, extra ports-443 = Infrastructure Management
Dashy = webui ports-8080, extra ports-4000 = Infrastructure Management
Organizr = webui ports-80, extra ports-443 = Infrastructure Management
Flame = webui ports-5005, extra ports-80 = Infrastructure Management
Fenrus = webui ports-3000, extra ports-80 = Infrastructure Management
Glance = webui ports-8080, extra ports-80 = Infrastructure Management
OliveTin = webui ports-1337, extra ports-22 = Infrastructure Management
Rundeck = webui ports-4440, extra ports-4443 = Infrastructure Management
Ansible Semaphore = webui ports-3000, extra ports-22 = Infrastructure Management
AWX = webui ports-80, extra ports-443 = Infrastructure Management
Terraform = webui ports-none, extra ports-22 = Infrastructure Management
Vagrant = webui ports-none, extra ports-22 = Infrastructure Management
IT-Tools = webui ports-80, extra ports-443 = Infrastructure Management
CyberChef = webui ports-80, extra ports-8000 = Infrastructure Management
Stirling-PDF = webui ports-8080, extra ports-80 = Infrastructure Management
Paperless-ngx = webui ports-8000, extra ports-80 = Infrastructure Management
Papermerge = webui ports-8000, extra ports-80 = Infrastructure Management
DocSpell = webui ports-7880, extra ports-80 = Infrastructure Management
Wiki.js = webui ports-3000, extra ports-80 = Infrastructure Management
BookStack = webui ports-80, extra ports-443 = Infrastructure Management
DokuWiki = webui ports-80, extra ports-443 = Infrastructure Management
Obsidian Remote = webui ports-8080, extra ports-80 = Infrastructure Management
Joplin Server = webui ports-22300, extra ports-80 = Infrastructure Management
Trilium Notes = webui ports-8080, extra ports-80 = Infrastructure Management
Outline = webui ports-3000, extra ports-80 = Infrastructure Management
Affine = webui ports-3000, extra ports-80 = Infrastructure Management
Standard Notes = webui ports-80, extra ports-443 = Infrastructure Management
Peppermint = webui ports-80, extra ports-443 = Infrastructure Management
Snipe-IT = webui ports-80, extra ports-443 = Infrastructure Management
Ralph = webui ports-80, extra ports-443 = Infrastructure Management
NetBox = webui ports-8000, extra ports-80 = Infrastructure Management
PHPIPAM = webui ports-80, extra ports-443 = Infrastructure Management
NIPAP = webui ports-5000, extra ports-80 = Infrastructure Management
RackTables = webui ports-80, extra ports-443 = Infrastructure Management
OpenDCIM = webui ports-80, extra ports-443 = Infrastructure Management
Cachet = webui ports-8000, extra ports-80 = Infrastructure Management
Statping = webui ports-8080, extra ports-80 = Infrastructure Management
Upptime = webui ports-80, extra ports-443 = Infrastructure Management
Uptime Kuma = webui ports-3001, extra ports-80 = Network Monitoring
Nagios = webui ports-80, extra ports-5666 = Network Monitoring
Zabbix = webui ports-80, extra ports-10050,10051 = Network Monitoring
LibreNMS = webui ports-80, extra ports-443,161 = Network Monitoring
Observium = webui ports-80, extra ports-443,161 = Network Monitoring
Checkmk = webui ports-5000, extra ports-6556 = Network Monitoring
Icinga 2 = webui ports-80, extra ports-5665 = Network Monitoring
Prometheus = webui ports-9090, extra ports-9100 = Network Monitoring
Grafana = webui ports-3000, extra ports-80 = Network Monitoring
Netdata = webui ports-19999, extra ports-80 = Network Monitoring
Glances = webui ports-61208, extra ports-80 = Network Monitoring
Beszel = webui ports-45876, extra ports-80 = Network Monitoring
Cacti = webui ports-80, extra ports-161,162 = Network Monitoring
Smokeping = webui ports-80, extra ports-443 = Network Monitoring
Pingvin = webui ports-3000, extra ports-80 = Network Monitoring
Gatus = webui ports-8080, extra ports-80 = Network Monitoring
Blackbox Exporter = webui ports-9115, extra ports-80 = Network Monitoring
Node Exporter = webui ports-9100, extra ports-80 = Network Monitoring
Cadvisor = webui ports-8080, extra ports-80 = Network Monitoring
Telegraf = webui ports-none, extra ports-8125,8092,8094 = Network Monitoring
InfluxDB = webui ports-8086, extra ports-8088 = Network Monitoring
VictoriaMetrics = webui ports-8428, extra ports-2003,4242 = Network Monitoring
Thanoss = webui ports-10902, extra ports-10901 = Network Monitoring
Loki = webui ports-3100, extra ports-9096 = Network Monitoring
Graylog = webui ports-9000, extra ports-12201,514 = Network Monitoring
ELK Stack = webui ports-5601, extra ports-9200,5044 = Network Monitoring
Splunk = webui ports-8000, extra ports-8089,9997 = Network Monitoring
Wazuh = webui ports-55000, extra ports-1514,1515 = Security & Firewall
Security Onion = webui ports-443, extra ports-22 = Security & Firewall
PfSense = webui ports-80, extra ports-443,22 = Security & Firewall
OPNsense = webui ports-80, extra ports-443,22 = Security & Firewall
OpenWrt = webui ports-80, extra ports-443,22 = Security & Firewall
DD-WRT = webui ports-80, extra ports-443,22 = Security & Firewall
Pi-hole = webui ports-80, extra ports-53,443 = Security & Firewall
AdGuard Home = webui ports-80, extra ports-53,3000,853 = Security & Firewall
Technitium = webui ports-5380, extra ports-53,853 = Security & Firewall
Unbound = webui ports-53, extra ports-8953 = Security & Firewall
Bind9 = webui ports-53, extra ports-953 = Security & Firewall
PowerDNS = webui ports-8081, extra ports-53 = Security & Firewall
Nginx Proxy Manager = webui ports-81, extra ports-80,443 = Security & Firewall
Traefik = webui ports-8080, extra ports-80,443 = Security & Firewall
Caddy = webui ports-80, extra ports-443,2019 = Security & Firewall
Haproxy = webui ports-80, extra ports-443,1936 = Security & Firewall
SWAG = webui ports-80, extra ports-443 = Security & Firewall
Authelia = webui ports-9091, extra ports-80 = Security & Firewall
Authentik = webui ports-9000, extra ports-9443,389 = Security & Firewall
Keycloak = webui ports-8080, extra ports-8443 = Security & Firewall
Gluu = webui ports-80, extra ports-443 = Security & Firewall
Teleport = webui ports-3080, extra ports-3022,3025 = Security & Firewall
Vaultwarden = webui ports-80, extra ports-443,3012 = Security & Firewall
Bitwarden = webui ports-80, extra ports-443 = Security & Firewall
Passbolt = webui ports-80, extra ports-443 = Security & Firewall
KeeWeb = webui ports-80, extra ports-443 = Security & Firewall
Psono = webui ports-80, extra ports-443 = Security & Firewall
Padloc = webui ports-80, extra ports-443 = Security & Firewall
WireGuard = webui ports-none, extra ports-51820 = Security & Firewall
WireGuard Easy = webui ports-51821, extra ports-51820 = Security & Firewall
OpenVPN AS = webui ports-943, extra ports-1194 = Security & Firewall
Tailscale = webui ports-8088, extra ports-41641 = Security & Firewall
Headscale = webui ports-8080, extra ports-80 = Security & Firewall
Netbird = webui ports-33073, extra ports-80 = Security & Firewall
Firezone = webui ports-80, extra ports-443,51820 = Security & Firewall
OmniEdge = webui ports-80, extra ports-443 = Security & Firewall
Nebula = webui ports-none, extra ports-4242 = Security & Firewall
Zerotier = webui ports-9993, extra ports-9993 = Security & Firewall
CrowdSec = webui ports-8080, extra ports-6060 = Security & Firewall
Fail2Ban = webui ports-none, extra ports-22 = Security & Firewall
Snort = webui ports-none, extra ports-22 = Security & Firewall
Suricata = webui ports-none, extra ports-22 = Security & Firewall
Frigate = webui ports-5000, extra ports-1935,8554 = Security & Firewall
Blue Iris = webui ports-81, extra ports-80 = Security & Firewall
ZoneMinder = webui ports-80, extra ports-443 = Security & Firewall
Shinobi = webui ports-8080, extra ports-80 = Security & Firewall
Agent DVR = webui ports-8090, extra ports-80 = Security & Firewall
MotionEye = webui ports-8765, extra ports-8081 = Security & Firewall
"""

# Due to the massive size, I'll continue in the next file with a complete generator
print("Parsing app list...")
