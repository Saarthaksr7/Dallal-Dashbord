from pydantic_settings import BaseSettings
from typing import List, Optional
import os
from functools import lru_cache

class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    See .env.example for all available options.
    """
    
    # Application
    PROJECT_NAME: str = "Dallal Dashboard"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"  # development, staging, production
    
    # Security - JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours
    
    # Refresh Token (optional but recommended for production)
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    REFRESH_SECRET_KEY: Optional[str] = None
    
    # Database
    DATABASE_URL: str = "sqlite:///./dallal.db"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    
    # Redis (optional - for caching)
    REDIS_URL: Optional[str] = None
    REDIS_ENABLED: bool = False
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000"
    ]
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_ENABLED: bool = True
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"  # json or text
    LOG_FILE_PATH: str = "./logs/app.log"
    LOG_MAX_BYTES: int = 10485760  # 10MB
    LOG_BACKUP_COUNT: int = 5
    
    # Email/SMTP
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: Optional[str] = None
    SMTP_FROM_NAME: Optional[str] = None
    EMAIL_ENABLED: bool = False
    
    # Monitoring & Alerting
    ALERT_EMAIL_RECIPIENTS: Optional[str] = None
    WEBHOOK_URL: Optional[str] = None
    SENTRY_DSN: Optional[str] = None
    
    # SSH Configuration
    SSH_KEY_PATH: str = "./keys"
    SSH_CONNECTION_TIMEOUT: int = 30
    MAX_SSH_SESSIONS: int = 10
    
    # Docker
    DOCKER_HOST: str = "unix:///var/run/docker.sock"
    
    # Service Discovery
    MDNS_ENABLED: bool = True
    DISCOVERY_INTERVAL_SECONDS: int = 300
    
    # Security Policies
    MAX_LOGIN_ATTEMPTS: int = 5
    LOCKOUT_DURATION_MINUTES: int = 15
    SESSION_TIMEOUT_MINUTES: int = 60
    PASSWORD_MIN_LENGTH: int = 8
    REQUIRE_STRONG_PASSWORD: bool = True
    
    # File Uploads
    MAX_UPLOAD_SIZE_MB: int = 100
    ALLOWED_UPLOAD_EXTENSIONS: str = ".zip,.tar,.gz,.json"
    
    # Backup
    BACKUP_ENABLED: bool = True
    BACKUP_SCHEDULE: str = "0 2 * * *"  # Daily at 2 AM
    BACKUP_RETENTION_DAYS: int = 30
    BACKUP_PATH: str = "./backups"
    
    # SNMP
    SNMP_TRAP_PORT: int = 162
    SNMP_COMMUNITY: str = "public"
    
    # Production Server (Gunicorn)
    WORKER_PROCESSES: int = 4
    GUNICORN_BIND: str = "0.0.0.0:8000"
    GUNICORN_WORKERS: int = 4
    GUNICORN_WORKER_CLASS: str = "uvicorn.workers.UvicornWorker"
    
    # Optional: Master key for credential vault
    DALLAL_SECRET_KEY: Optional[str] = None
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        env_file_encoding = "utf-8"
    
    # Helper properties
    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"
    
    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"
    
    @property
    def database_url_safe(self) -> str:
        """Return database URL without password for logging"""
        if "://" in self.DATABASE_URL:
            protocol, rest = self.DATABASE_URL.split("://", 1)
            if "@" in rest:
                credentials, host_db = rest.split("@", 1)
                username = credentials.split(":")[0] if ":" in credentials else credentials
                return f"{protocol}://{username}:***@{host_db}"
        return self.DATABASE_URL
    
    @property
    def allowed_extensions_list(self) -> List[str]:
        """Return list of allowed file extensions"""
        return [ext.strip() for ext in self.ALLOWED_UPLOAD_EXTENSIONS.split(",")]
    
    @property
    def alert_recipients_list(self) -> List[str]:
        """Return list of alert email recipients"""
        if not self.ALERT_EMAIL_RECIPIENTS:
            return []
        return [email.strip() for email in self.ALERT_EMAIL_RECIPIENTS.split(",")]
    
    # Validation
    def validate_settings(self):
        """Validate critical settings"""
        errors = []
        
        # Check secret key in production
        if self.is_production:
            if self.SECRET_KEY == "change_this_to_a_secure_random_string_in_production_minimum_32_chars":
                errors.append("SECRET_KEY must be changed in production!")
            
            if len(self.SECRET_KEY) < 32:
                errors.append("SECRET_KEY must be at least 32 characters long")
            
            if "localhost" in str(self.BACKEND_CORS_ORIGINS):
                errors.append("Remove localhost from CORS origins in production")
        
        # Check database URL format
        if not self.DATABASE_URL.startswith(("sqlite://", "postgresql://", "mysql://")):
            errors.append("Invalid DATABASE_URL format")
        
        if errors:
            raise ValueError(f"Configuration errors: {', '.join(errors)}")
        
        return True

@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    Using lru_cache ensures settings are only loaded once.
    """
    settings = Settings()
    
    # Validate in production
    if settings.is_production:
        settings.validate_settings()
    
    return settings

# Global settings instance
settings = get_settings()

# Log configuration (excluding sensitive data)
if settings.is_development:
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Database: {settings.database_url_safe}")
    logger.info(f"CORS Origins: {settings.BACKEND_CORS_ORIGINS}")
