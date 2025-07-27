# Use official Ubuntu as base
FROM ubuntu:24.04

# Disable tzdata interactive prompts and set non-interactive mode
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies safely
RUN apt-get update && apt-get install -y \
    curl \
    ffmpeg \
    python3 \
    git \
    ca-certificates \
    wget \
    build-essential \
    && apt-get clean

# Install yt-dlp directly (not via pip)
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

# Install Go 1.23.11 manually
RUN wget https://go.dev/dl/go1.23.11.linux-amd64.tar.gz && \
    tar -C /usr/local -xzf go1.23.11.linux-amd64.tar.gz && \
    rm go1.23.11.linux-amd64.tar.gz

ENV PATH="/usr/local/go/bin:${PATH}"

# Set working directory
WORKDIR /app

# Copy Go files
COPY . .

# Build the Go app
RUN go build -o main .

# Expose the app port
EXPOSE 8080

# Run the app
CMD ["./main"]
