FROM golang:1.23.11

# Install system dependencies and yt-dlp
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    curl \
    git \
    build-essential && \
    python3 -m pip install --upgrade pip && \
    python3 -m pip install yt-dlp && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy source files
COPY . .

# Build the Go app
RUN go build -o main .

# Expose port
EXPOSE 8080

# Run the app
CMD ["./main"]
