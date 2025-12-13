from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
import logging
import sys

from app.core.config import settings
from app.core.database import init_db
from app.core.logging import setup_logging # New import
from app.api.v1 import services, auth, ssh, docker, settings as settings_router, sftp, keys, audit, webhooks, backup, wol, traps, api_keys, vcs, rdp
from app.api import notifications

# Initialize Sentry (only in production)
if settings.is_production and settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        integrations=[FastApiIntegration()],
        traces_sample_rate=0.1,  # 10% of transactions for performance monitoring
        environment=settings.ENVIRONMENT,
        release=f"dallal-dashboard@2.0.0"
    )
from app.services.status_engine import service_monitor
from app.services.discovery import discovery_engine
from app.services.trap_receiver import trap_receiver
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.core.rate_limit import limiter

# Initialize Logger
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    setup_logging() # Configure logging
    init_db()
    logger.info("Database initialized")
    
    await discovery_engine.start()
    logger.info("Discovery Engine (mDNS) started")
    
    service_monitor.start()
    logger.info("Service Monitor started")

    trap_receiver.start()
    logger.info("SNMP Trap Receiver started")

    # Initialize Email Scheduler
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
    from app.services.email_service import email_service
    
    scheduler = AsyncIOScheduler()
    # Runs every hour at minute 0
    scheduler.add_job(email_service.process_digest, 'cron', minute=0, args=['hourly'])
    # Runs every day at 9:00 AM
    scheduler.add_job(email_service.process_digest, 'cron', hour=9, minute=0, args=['daily'])
    # Runs every Monday at 9:00 AM
    scheduler.add_job(email_service.process_digest, 'cron', day_of_week='mon', hour=9, minute=0, args=['weekly'])
    
    scheduler.start()
    logger.info("Email Digest Scheduler started")
    
    yield
    
    # Shutdown
    scheduler.shutdown()
    service_monitor.stop()
    discovery_engine.stop()
    trap_receiver.stop()
    logger.info("Application shutdown")

app = FastAPI(
    title=settings.PROJECT_NAME, 
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Rate Limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# CORS - Configure based on environment (ADD FIRST so it processes LAST)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Temporarily allow all for development
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count", "X-Page-Count"]
)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    # CSP
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' ws: wss: http: https:;"
    # Other Security Headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global Exception: {exc}")
    logger.exception(exc)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"},
    )

# Register Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}", tags=["auth"])
app.include_router(services.router, prefix=f"{settings.API_V1_STR}/services", tags=["services"])
app.include_router(ssh.router, tags=["ssh"])
app.include_router(docker.router, prefix=f"{settings.API_V1_STR}/docker", tags=["docker"])
app.include_router(settings_router.router, prefix=f"{settings.API_V1_STR}/settings", tags=["settings"])
app.include_router(sftp.router, prefix=f"{settings.API_V1_STR}/sftp", tags=["sftp"])
app.include_router(keys.router, prefix=f"{settings.API_V1_STR}/keys", tags=["keys"])
app.include_router(audit.router, prefix=f"{settings.API_V1_STR}/audit", tags=["audit"])
app.include_router(webhooks.router, prefix=f"{settings.API_V1_STR}/webhooks", tags=["webhooks"])
app.include_router(backup.router, prefix=f"{settings.API_V1_STR}/backup", tags=["backup"])
app.include_router(wol.router, prefix=f"{settings.API_V1_STR}/wol", tags=["wol"])
app.include_router(traps.router, prefix=f"{settings.API_V1_STR}/traps", tags=["traps"])
app.include_router(api_keys.router, prefix=f"{settings.API_V1_STR}/api-keys", tags=["api-keys"])
app.include_router(vcs.router, prefix=f"{settings.API_V1_STR}/vcs", tags=["vcs"])
app.include_router(notifications.router, prefix="/api", tags=["notifications"])

from app.api.v1 import reports
app.include_router(reports.router, prefix=f"{settings.API_V1_STR}/reports", tags=["reports"])
app.include_router(rdp.router, prefix=f"{settings.API_V1_STR}/rdp", tags=["rdp"])

# Prometheus Metrics - Exposes /metrics endpoint for monitoring
Instrumentator().instrument(app).expose(app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
    # Reload trigger 2
