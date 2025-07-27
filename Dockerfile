FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    ffmpeg \
    python3 \
    python3-pip \
    git \
    build-essential

# Install Go 1.23.11
RUN wget https://go.dev/dl/go1.23.11.linux-amd64.tar.gz && \
    tar -C /usr/local -xzf go1.23.11.linux-amd64.tar.gz && \
    rm go1.23.11.linux-amd64.tar.gz
ENV PATH="/usr/local/go/bin:$PATH"

# Install yt-dlp
RUN pip3 install yt-dlp --break-system-packages

# Set working directory
WORKDIR /app

# Copy files
COPY . .

# Build binary
RUN go build -o main .

# Expose port
EXPOSE 8080

# Run the app
CMD ["./main"]
