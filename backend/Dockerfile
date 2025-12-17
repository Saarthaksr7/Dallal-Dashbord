# Use an official Python runtime as a parent image
FROM python:3.12-slim

# Set environment variables
# PYTHONDONTWRITEBYTECODE: Prevents Python from writing pyc files to disc
# PYTHONUNBUFFERED: Prevents Python from buffering stdout and stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies
# - build-essential: for compilation if needed
# - nmap, iputils-ping: for network scanning
# - guacd: Apache Guacamole daemon for RDP/VNC/SSH proxying
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    nmap \
    iputils-ping \
    libcairo2-dev \
    libjpeg62-turbo-dev \
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
    guacd \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Expose port
EXPOSE 8000

# Run the application
# Note: Running as root to allow guacd to bind to ports and manage processes
# In production, consider using capabilities instead of full root access
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
