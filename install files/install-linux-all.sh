#!/bin/bash
# ============================================================================
# Dallal Dashboard - Complete Linux Installer with Docker & Guacamole
# One-stop installation script with systemd service integration
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
LOG_FILE="$SCRIPT_DIR/install-all.log"

# Installation flags
INSTALL_DOCKER=false
INSTALL_GUACAMOLE=false
INSTALL_DASHBOARD=false
SETUP_SYSTEMD=false
ENABLE_AUTOSTART=false

# Guacamole configuration
GUACD_PORT=4822
GUACAMOLE_VERSION="1.5.4"

# ============================================================================
# Utility Functions
# ============================================================================

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

log_warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1" | tee -a "$LOG_FILE"
}

check_root() {
    if [ "$EUID" -eq 0 ]; then
        log_warn "Running as root. This is not recommended for security reasons."
        read -p "Continue anyway? (y/n): " CONTINUE
        if [[ ! $CONTINUE =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

detect_distro() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        DISTRO=$ID
        DISTRO_VERSION=$VERSION_ID
        log_info "Detected: $NAME $VERSION"
    else
        log_error "Cannot detect Linux distribution"
        exit 1
    fi
}

check_command() {
    if command -v "$1" &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# ============================================================================
# Main Menu
# ============================================================================

show_main_menu() {
    clear
    cat << "EOF"
╔════════════════════════════════════════════════════════════════════════╗
║                                                                        ║
║        DALLAL DASHBOARD - Complete Linux Installation Suite           ║
║                                                                        ║
╚════════════════════════════════════════════════════════════════════════╝

This installer will help you set up:
  • Dallal Dashboard (Backend + Frontend)
  • Docker (container management)
  • Apache Guacamole (remote desktop gateway)
  • Systemd services (auto-start at boot)

EOF

    echo -e "${GREEN}Installation Options:${NC}"
    echo "  [1] Full Installation (Everything)"
    echo "  [2] Dashboard Only"
    echo "  [3] Dashboard + Docker"
    echo "  [4] Dashboard + Guacamole"
    echo "  [5] Custom Installation"
    echo ""
    echo -e "${YELLOW}Management Options:${NC}"
    echo "  [6] Start Services"
    echo "  [7] Stop Services"
    echo "  [8] Check Service Status"
    echo "  [9] Enable Auto-Start at Boot"
    echo "  [10] Disable Auto-Start at Boot"
    echo ""
    echo "  [0] Exit"
    echo ""
    echo "════════════════════════════════════════════════════════════════════════"
}

# ============================================================================
# Docker Installation
# ============================================================================

install_docker() {
    log "Installing Docker..."
    
    if check_command docker; then
        log_info "Docker is already installed"
        docker --version | tee -a "$LOG_FILE"
        return 0
    fi
    
    case $DISTRO in
        ubuntu|debian)
            log_info "Installing Docker on Debian/Ubuntu..."
            sudo apt-get update
            sudo apt-get install -y \
                ca-certificates \
                curl \
                gnupg \
                lsb-release
            
            # Add Docker's official GPG key
            sudo mkdir -p /etc/apt/keyrings
            curl -fsSL https://download.docker.com/linux/$DISTRO/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
            
            # Set up repository
            echo \
              "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$DISTRO \
              $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
            
            # Install Docker Engine
            sudo apt-get update
            sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            ;;
            
        fedora|rhel|centos)
            log_info "Installing Docker on Fedora/RHEL/CentOS..."
            sudo dnf -y install dnf-plugins-core
            sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
            sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            ;;
            
        arch)
            log_info "Installing Docker on Arch Linux..."
            sudo pacman -Sy --noconfirm docker docker-compose
            ;;
            
        *)
            log_error "Unsupported distribution for automatic Docker installation"
            log_info "Please install Docker manually from https://docs.docker.com/engine/install/"
            return 1
            ;;
    esac
    
    # Start and enable Docker
    sudo systemctl start docker
    sudo systemctl enable docker
    
    # Add current user to docker group
    if [ "$EUID" -ne 0 ]; then
        sudo usermod -aG docker $USER
        log_warn "Added $USER to docker group. You may need to log out and back in for this to take effect."
    fi
    
    log "Docker installed successfully"
}

# ============================================================================
# Guacamole Installation
# ============================================================================

install_guacamole() {
    log "Installing Apache Guacamole..."
    
    # Check if already running
    if sudo systemctl is-active --quiet guacd 2>/dev/null; then
        log_info "Guacamole daemon (guacd) is already running"
        return 0
    fi
    
    # Install dependencies based on distro
    case $DISTRO in
        ubuntu|debian)
            log_info "Installing Guacamole dependencies on Debian/Ubuntu..."
            sudo apt-get update
            sudo apt-get install -y \
                build-essential \
                libcairo2-dev \
                libjpeg-turbo8-dev \
                libpng-dev \
                libtool-bin \
                libossp-uuid-dev \
                libavcodec-dev \
                libavformat-dev \
                libavutil-dev \
                libswscale-dev \
                freerdp2-dev \
                libpango1.0-dev \
                libssh2-1-dev \
                libtelnet-dev \
                libvncserver-dev \
                libwebsockets-dev \
                libpulse-dev \
                libssl-dev \
                libvorbis-dev \
                libwebp-dev \
                tomcat9 \
                tomcat9-admin \
                tomcat9-common \
                tomcat9-user
            ;;
            
        fedora|rhel|centos)
            log_info "Installing Guacamole dependencies on Fedora/RHEL/CentOS..."
            sudo dnf install -y \
                cairo-devel \
                libjpeg-turbo-devel \
                libpng-devel \
                libtool \
                uuid-devel \
                ffmpeg-devel \
                freerdp-devel \
                pango-devel \
                libssh2-devel \
                libtelnet-devel \
                libvncserver-devel \
                libwebsockets-devel \
                pulseaudio-libs-devel \
                openssl-devel \
                libvorbis-devel \
                libwebp-devel \
                tomcat
            ;;
            
        *)
            log_warn "Manual Guacamole installation required for $DISTRO"
            log_info "Attempting to use Docker-based Guacamole instead..."
            install_guacamole_docker
            return $?
            ;;
    esac
    
    # Download and compile guacamole-server
    cd /tmp
    wget "https://downloads.apache.org/guacamole/${GUACAMOLE_VERSION}/source/guacamole-server-${GUACAMOLE_VERSION}.tar.gz"
    tar -xzf "guacamole-server-${GUACAMOLE_VERSION}.tar.gz"
    cd "guacamole-server-${GUACAMOLE_VERSION}"
    
    ./configure --with-init-dir=/etc/init.d
    make
    sudo make install
    sudo ldconfig
    
    # Create systemd service
    create_guacd_service
    
    # Start guacd
    sudo systemctl daemon-reload
    sudo systemctl start guacd
    sudo systemctl enable guacd
    
    log "Guacamole installed successfully"
    cd "$SCRIPT_DIR"
}

install_guacamole_docker() {
    log_info "Installing Guacamole using Docker..."
    
    if ! check_command docker; then
        log_error "Docker is required for Docker-based Guacamole installation"
        return 1
    fi
    
    # Create Guacamole directories
    sudo mkdir -p /opt/guacamole/{config,data}
    
    # Start guacd container
    sudo docker run -d \
        --name guacd \
        --restart unless-stopped \
        -p $GUACD_PORT:4822 \
        guacamole/guacd
    
    log "Guacamole (Docker) installed successfully"
}

create_guacd_service() {
    sudo tee /etc/systemd/system/guacd.service > /dev/null << 'EOF'
[Unit]
Description=Guacamole proxy daemon
Documentation=man:guacd(8)
After=network.target

[Service]
Type=forking
ExecStart=/usr/local/sbin/guacd
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
}

# ============================================================================
# Dashboard Installation
# ============================================================================

install_dependencies() {
    log "Installing system dependencies..."
    
    case $DISTRO in
        ubuntu|debian)
            sudo apt-get update
            sudo apt-get install -y \
                python3 \
                python3-pip \
                python3-venv \
                build-essential \
                python3-dev \
                libpq-dev \
                nodejs \
                npm \
                git \
                curl \
                wget
            ;;
            
        fedora|rhel|centos)
            sudo dnf install -y \
                python3 \
                python3-pip \
                python3-devel \
                gcc \
                postgresql-devel \
                nodejs \
                npm \
                git \
                curl \
                wget
            ;;
            
        arch)
            sudo pacman -Sy --noconfirm \
                python \
                python-pip \
                base-devel \
                postgresql-libs \
                nodejs \
                npm \
                git \
                curl \
                wget
            ;;
    esac
    
    log "System dependencies installed"
}

install_dashboard() {
    log "Installing Dallal Dashboard..."
    
    # Install system dependencies
    install_dependencies
    
    # Create virtual environment
    cd "$PROJECT_ROOT"
    
    if [ ! -d ".venv" ]; then
        log_info "Creating Python virtual environment..."
        python3 -m venv .venv
    fi
    
    # Activate virtual environment
    source .venv/bin/activate
    
    # Upgrade pip
    log_info "Upgrading pip..."
    pip install --upgrade pip
    
    # Install Python dependencies
    log_info "Installing Python packages..."
    if [ -f "$BACKEND_DIR/requirements.txt" ]; then
        pip install -r "$BACKEND_DIR/requirements.txt"
    else
        log_error "requirements.txt not found in $BACKEND_DIR"
        return 1
    fi
    
    # Setup .env if not exists
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        log_info "Setting up environment configuration..."
        setup_env_quick
    fi
    
    # Build frontend if needed
    if [ -d "$FRONTEND_DIR" ]; then
        log_info "Building frontend..."
        cd "$FRONTEND_DIR"
        if [ -f "package.json" ]; then
            npm install
            npm run build
        fi
    fi
    
    log "Dashboard installation completed"
    cd "$SCRIPT_DIR"
}

setup_env_quick() {
    log_info "Creating .env file with default configuration..."
    
    # Generate secret keys
    SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
    REFRESH_SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
    
    cat > "$BACKEND_DIR/.env" << EOF
# Dallal Dashboard - Backend Configuration
# Auto-generated by install-linux-all.sh on $(date)

PROJECT_NAME=Dallal Dashboard
API_V1_STR=/api/v1
ENVIRONMENT=production

SECRET_KEY=$SECRET_KEY
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
REFRESH_TOKEN_EXPIRE_DAYS=7
REFRESH_SECRET_KEY=$REFRESH_SECRET_KEY

DATABASE_URL=sqlite:///./dallal.db
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20

BACKEND_CORS_ORIGINS=["http://localhost:5173","http://localhost:3000","http://localhost:8000"]

REDIS_URL=redis://localhost:6379/0
REDIS_ENABLED=false

RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_ENABLED=true

LOG_LEVEL=INFO
LOG_FORMAT=json
LOG_FILE_PATH=./logs/app.log
LOG_MAX_BYTES=10485760
LOG_BACKUP_COUNT=5

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
SMTP_FROM_EMAIL=noreply@yourdomain.com
SMTP_FROM_NAME=Dallal Dashboard
EMAIL_ENABLED=false

SSH_KEY_PATH=./keys
SSH_CONNECTION_TIMEOUT=30
MAX_SSH_SESSIONS=10

DOCKER_HOST=unix:///var/run/docker.sock

MDNS_ENABLED=true
DISCOVERY_INTERVAL_SECONDS=300

MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
SESSION_TIMEOUT_MINUTES=60
PASSWORD_MIN_LENGTH=8
REQUIRE_STRONG_PASSWORD=true

MAX_UPLOAD_SIZE_MB=100
ALLOWED_UPLOAD_EXTENSIONS=.zip,.tar,.gz,.json

BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
BACKUP_PATH=./backups

SNMP_TRAP_PORT=162
SNMP_COMMUNITY=public

WORKER_PROCESSES=4
GUNICORN_BIND=0.0.0.0:8000
GUNICORN_WORKERS=4
GUNICORN_WORKER_CLASS=uvicorn.workers.UvicornWorker

# Guacamole Integration
GUACD_HOSTNAME=localhost
GUACD_PORT=$GUACD_PORT
EOF
    
    log "Environment configuration created at $BACKEND_DIR/.env"
}

# ============================================================================
# Systemd Service Setup
# ============================================================================

create_systemd_service() {
    log "Creating systemd service for Dallal Dashboard..."
    
    local SERVICE_USER=${SUDO_USER:-$USER}
    local VENV_PATH="$PROJECT_ROOT/.venv"
    local PYTHON_PATH="$VENV_PATH/bin/python3"
    local MAIN_PY="$BACKEND_DIR/main.py"
    
    sudo tee /etc/systemd/system/dallal-dashboard.service > /dev/null << EOF
[Unit]
Description=Dallal Dashboard Service
After=network.target docker.service guacd.service
Wants=docker.service guacd.service

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$BACKEND_DIR
Environment="PATH=$VENV_PATH/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
ExecStart=$PYTHON_PATH $MAIN_PY
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=dallal-dashboard

[Install]
WantedBy=multi-user.target
EOF
    
    sudo systemctl daemon-reload
    log "Systemd service created: dallal-dashboard.service"
}

# ============================================================================
# Service Management
# ============================================================================

start_services() {
    log "Starting services..."
    
    if [ "$INSTALL_DOCKER" = true ] || sudo systemctl list-unit-files | grep -q docker.service; then
        sudo systemctl start docker
        log_info "Docker started"
    fi
    
    if [ "$INSTALL_GUACAMOLE" = true ] || sudo systemctl list-unit-files | grep -q guacd.service; then
        sudo systemctl start guacd
        log_info "Guacamole daemon started"
    fi
    
    if sudo systemctl list-unit-files | grep -q dallal-dashboard.service; then
        sudo systemctl start dallal-dashboard
        log_info "Dallal Dashboard started"
        echo ""
        log "Dashboard is running at: http://localhost:8000"
        log "API Documentation: http://localhost:8000/docs"
    fi
    
    echo ""
    read -p "Press Enter to continue..."
}

stop_services() {
    log "Stopping services..."
    
    if sudo systemctl is-active --quiet dallal-dashboard; then
        sudo systemctl stop dallal-dashboard
        log_info "Dallal Dashboard stopped"
    fi
    
    if sudo systemctl is-active --quiet guacd; then
        sudo systemctl stop guacd
        log_info "Guacamole daemon stopped"
    fi
    
    if sudo systemctl is-active --quiet docker; then
        read -p "Stop Docker? This will stop all containers (y/n): " STOP_DOCKER
        if [[ $STOP_DOCKER =~ ^[Yy]$ ]]; then
            sudo systemctl stop docker
            log_info "Docker stopped"
        fi
    fi
    
    echo ""
    read -p "Press Enter to continue..."
}

check_service_status() {
    clear
    echo "════════════════════════════════════════════════════════════════════════"
    echo "                        SERVICE STATUS"
    echo "════════════════════════════════════════════════════════════════════════"
    echo ""
    
    services=("docker" "guacd" "dallal-dashboard")
    
    for service in "${services[@]}"; do
        echo -e "${BLUE}$service:${NC}"
        if sudo systemctl list-unit-files | grep -q "^$service.service"; then
            sudo systemctl status "$service" --no-pager -l || true
        else
            echo "  Service not installed"
        fi
        echo ""
        echo "────────────────────────────────────────────────────────────────────────"
        echo ""
    done
    
    read -p "Press Enter to continue..."
}

enable_autostart() {
    log "Enabling auto-start at boot..."
    
    if sudo systemctl list-unit-files | grep -q docker.service; then
        sudo systemctl enable docker
        log_info "Docker enabled for auto-start"
    fi
    
    if sudo systemctl list-unit-files | grep -q guacd.service; then
        sudo systemctl enable guacd
        log_info "Guacamole enabled for auto-start"
    fi
    
    if sudo systemctl list-unit-files | grep -q dallal-dashboard.service; then
        sudo systemctl enable dallal-dashboard
        log_info "Dallal Dashboard enabled for auto-start"
    fi
    
    log "Services will now start automatically at boot"
    echo ""
    read -p "Press Enter to continue..."
}

disable_autostart() {
    log "Disabling auto-start at boot..."
    
    if sudo systemctl is-enabled --quiet dallal-dashboard 2>/dev/null; then
        sudo systemctl disable dallal-dashboard
        log_info "Dallal Dashboard auto-start disabled"
    fi
    
    read -p "Disable Guacamole auto-start? (y/n): " DISABLE_GUACD
    if [[ $DISABLE_GUACD =~ ^[Yy]$ ]]; then
        if sudo systemctl is-enabled --quiet guacd 2>/dev/null; then
            sudo systemctl disable guacd
            log_info "Guacamole auto-start disabled"
        fi
    fi
    
    read -p "Disable Docker auto-start? (y/n): " DISABLE_DOCKER
    if [[ $DISABLE_DOCKER =~ ^[Yy]$ ]]; then
        if sudo systemctl is-enabled --quiet docker 2>/dev/null; then
            sudo systemctl disable docker
            log_info "Docker auto-start disabled"
        fi
    fi
    
    log "Auto-start settings updated"
    echo ""
    read -p "Press Enter to continue..."
}

# ============================================================================
# Installation Workflows
# ============================================================================

full_installation() {
    INSTALL_DOCKER=true
    INSTALL_GUACAMOLE=true
    INSTALL_DASHBOARD=true
    SETUP_SYSTEMD=true
    
    log "Starting full installation..."
    
    install_docker
    install_guacamole
    install_dashboard
    create_systemd_service
    
    echo ""
    log "Full installation completed successfully!"
    echo ""
    read -p "Start services now? (y/n): " START_NOW
    if [[ $START_NOW =~ ^[Yy]$ ]]; then
        start_services
    fi
    
    read -p "Enable auto-start at boot? (y/n): " ENABLE_AUTO
    if [[ $ENABLE_AUTO =~ ^[Yy]$ ]]; then
        enable_autostart
    fi
}

dashboard_only() {
    INSTALL_DASHBOARD=true
    SETUP_SYSTEMD=true
    
    log "Installing Dashboard only..."
    install_dashboard
    create_systemd_service
    
    echo ""
    log "Dashboard installation completed!"
    echo ""
    read -p "Start dashboard now? (y/n): " START_NOW
    if [[ $START_NOW =~ ^[Yy]$ ]]; then
        start_services
    fi
}

dashboard_with_docker() {
    INSTALL_DOCKER=true
    INSTALL_DASHBOARD=true
    SETUP_SYSTEMD=true
    
    log "Installing Dashboard with Docker..."
    install_docker
    install_dashboard
    create_systemd_service
    
    echo ""
    log "Installation completed!"
    echo ""
    read -p "Start services now? (y/n): " START_NOW
    if [[ $START_NOW =~ ^[Yy]$ ]]; then
        start_services
    fi
}

dashboard_with_guacamole() {
    INSTALL_GUACAMOLE=true
    INSTALL_DASHBOARD=true
    SETUP_SYSTEMD=true
    
    log "Installing Dashboard with Guacamole..."
    install_guacamole
    install_dashboard
    create_systemd_service
    
    echo ""
    log "Installation completed!"
    echo ""
    read -p "Start services now? (y/n): " START_NOW
    if [[ $START_NOW =~ ^[Yy]$ ]]; then
        start_services
    fi
}

custom_installation() {
    echo ""
    echo "Custom Installation Options"
    echo "────────────────────────────────────────────────────────────────────────"
    echo ""
    
    read -p "Install Docker? (y/n): " INSTALL_DOCKER_CHOICE
    [[ $INSTALL_DOCKER_CHOICE =~ ^[Yy]$ ]] && INSTALL_DOCKER=true
    
    read -p "Install Guacamole? (y/n): " INSTALL_GUAC_CHOICE
    [[ $INSTALL_GUAC_CHOICE =~ ^[Yy]$ ]] && INSTALL_GUACAMOLE=true
    
    read -p "Install Dashboard? (y/n): " INSTALL_DASH_CHOICE
    [[ $INSTALL_DASH_CHOICE =~ ^[Yy]$ ]] && INSTALL_DASHBOARD=true
    
    read -p "Setup systemd service? (y/n): " SETUP_SYS_CHOICE
    [[ $SETUP_SYS_CHOICE =~ ^[Yy]$ ]] && SETUP_SYSTEMD=true
    
    echo ""
    log "Starting custom installation..."
    
    [[ $INSTALL_DOCKER = true ]] && install_docker
    [[ $INSTALL_GUACAMOLE = true ]] && install_guacamole
    [[ $INSTALL_DASHBOARD = true ]] && install_dashboard
    [[ $SETUP_SYSTEMD = true ]] && create_systemd_service
    
    echo ""
    log "Custom installation completed!"
    echo ""
    read -p "Press Enter to continue..."
}

# ============================================================================
# Main Script
# ============================================================================

# Initialize log
echo "════════════════════════════════════════════════════════════════════════" > "$LOG_FILE"
echo "Dallal Dashboard - Installation Log" >> "$LOG_FILE"
echo "Started: $(date)" >> "$LOG_FILE"
echo "════════════════════════════════════════════════════════════════════════" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Detect distribution
detect_distro

# Main loop
while true; do
    show_main_menu
    read -p "Enter your choice: " CHOICE
    
    case $CHOICE in
        1) full_installation ;;
        2) dashboard_only ;;
        3) dashboard_with_docker ;;
        4) dashboard_with_guacamole ;;
        5) custom_installation ;;
        6) start_services ;;
        7) stop_services ;;
        8) check_service_status ;;
        9) enable_autostart ;;
        10) disable_autostart ;;
        0) 
            clear
            log "Exiting installer. Logs saved to: $LOG_FILE"
            echo ""
            echo "Thank you for using Dallal Dashboard!"
            echo ""
            exit 0
            ;;
        *)
            log_error "Invalid choice. Please try again."
            sleep 2
            ;;
    esac
done
