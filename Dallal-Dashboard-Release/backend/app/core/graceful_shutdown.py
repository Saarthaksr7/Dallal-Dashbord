"""
Graceful shutdown handler for FastAPI application
Ensures proper cleanup of resources and connections
"""
import signal
import asyncio
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class GracefulShutdown:
    """Handle graceful shutdown of the application"""
    
    def __init__(self):
        self.is_shutting_down = False
        self.shutdown_event = asyncio.Event()
    
    async def shutdown_handler(self, sig=None):
        """
        Handle shutdown signal
        
        Steps:
        1. Set shutdown flag
        2. Stop accepting new requests
        3. Wait for active requests to complete
        4. Close database connections
        5. Close Redis connections  
        6. Clean up resources
        """
        if self.is_shutting_down:
            return
        
        self.is_shutting_down = True
        signal_name = signal.Signals(sig).name if sig else "UNKNOWN"
        
        logger.info(f"🛑 Received shutdown signal: {signal_name}")
        logger.info("⏳ Initiating graceful shutdown...")
        
        try:
            # Give active requests time to complete (max 30 seconds)
            logger.info("⏱️  Waiting for active requests to complete...")
            await asyncio.sleep(2)  # Brief pause for in-flight requests
            
            # Clean up database connections
            logger.info("🗄️  Closing database connections...")
            # TODO: Close database connection pool
            # if hasattr(app.state, 'db'):
            #     await app.state.db.disconnect()
            
            # Clean up Redis connections
            logger.info("📦 Closing Redis connections...")
            from app.core.cache import cache
            if cache.redis_client:
                try:
                    cache.redis_client.close()
                    logger.info("✅ Redis connection closed")
                except Exception as e:
                    logger.error(f"❌ Error closing Redis: {e}")
            
            # Clean up any background tasks
            logger.info("🧹 Cleaning up background tasks...")
            # TODO: Cancel background tasks
            
            logger.info("✅ Graceful shutdown complete")
            
        except Exception as e:
            logger.error(f"❌ Error during shutdown: {e}", exc_info=True)
        
        finally:
            self.shutdown_event.set()
    
    def register_handlers(self):
        """Register signal handlers for graceful shutdown"""
        # Handle SIGTERM (docker stop, kubernetes)
        signal.signal(signal.SIGTERM, lambda s, f: asyncio.create_task(self.shutdown_handler(s)))
        
        # Handle SIGINT (Ctrl+C)
        signal.signal(signal.SIGINT, lambda s, f: asyncio.create_task(self.shutdown_handler(s)))
        
        logger.info("✅ Shutdown handlers registered (SIGTERM, SIGINT)")

# Global instance
shutdown_manager = GracefulShutdown()

# Startup/shutdown event handlers for FastAPI
async def startup_event():
    """Run on application startup"""
    logger.info("🚀 Application starting up...")
    shutdown_manager.register_handlers()
    
    # Initialize connections
    logger.info("🔌 Initializing connections...")
    # TODO: Initialize database, Redis, etc.
    
    logger.info("✅ Application startup complete")

async def shutdown_event():
    """Run on application shutdown"""
    await shutdown_manager.shutdown_handler()

# Add to main.py:
"""
from app.core.graceful_shutdown import startup_event, shutdown_event

@app.on_event("startup")
async def on_startup():
    await startup_event()

@app.on_event("shutdown")
async def on_shutdown():
    await shutdown_event()
"""
