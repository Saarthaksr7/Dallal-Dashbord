import os
import sys
import logging
from logging.handlers import RotatingFileHandler

def setup_logging():
    # Ensure logs directory exists
    log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "logs")
    os.makedirs(log_dir, exist_ok=True)
    
    log_file = os.path.join(log_dir, "dallal.log")

    # Formatters
    file_formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    console_formatter = logging.Formatter(
        "%(levelname)s: %(message)s"
    )

    # Handlers
    # 1. File Handler (Rotating)
    file_handler = RotatingFileHandler(
        log_file, maxBytes=10*1024*1024, backupCount=5, encoding="utf-8"
    )
    file_handler.setFormatter(file_formatter)
    file_handler.setLevel(logging.INFO)

    # 2. Console Handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(console_formatter)
    console_handler.setLevel(logging.INFO)

    # Root Logger Config
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    
    # Remove existing handlers to avoid duplicates on reload
    if root_logger.handlers:
        root_logger.handlers = []
    
    root_logger.addHandler(file_handler)
    root_logger.addHandler(console_handler)

    # Specific Loggers (Quiet down noisy libraries)
    logging.getLogger("uvicorn.access").handlers = [] # Let root handle it or silence
    logging.getLogger("uvicorn.access").propagate = True
    
    logging.getLogger("passlib").setLevel(logging.WARNING)
    
    logging.info(f"Logging initialized. Writing to {log_file}")
