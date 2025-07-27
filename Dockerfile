# Use Debian base
FROM debian:bookworm

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    ffmpeg \
    python3 \
    python3-pip \
    git \
    build-essential \
    ca-certificates \
    wget \
    && pip3 install yt-dlp \
    && apt-get clean

# Install Go 1.23 manually
RUN wget https://go.dev/dl/go1.23.linux-amd64.tar.gz && \
    tar -C /usr/local -xzf go1.23.linux-amd64.tar.gz && \
    rm go1.23.linux-amd64.tar.gz

# Set Go environment
ENV PATH="/usr/local/go/bin:${PATH}"

# Set working directory
WORKDIR /app

# Copy all files
COPY . .

# Build the Go app
RUN go build -o main .

# Expose port
EXPOSE 8080

# Start the app
CMD ["./main"]
