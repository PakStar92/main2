# Stage 1: Build Go binary using Go 1.23
FROM golang:1.23 AS builder

# Set working directory inside the container
WORKDIR /app

# Copy source code
COPY . .

# Build the Go app
RUN go build -o main .

# Stage 2: Final image with Ubuntu, yt-dlp, and ffmpeg
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

# Install yt-dlp, ffmpeg, and dependencies
RUN apt-get update && \
    apt-get install -y ffmpeg python3 python3-pip curl ca-certificates && \
    pip3 install yt-dlp && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory in final image
WORKDIR /app

# Copy built Go binary from builder
COPY --from=builder /app/main .

# Expose port
EXPOSE 8080

# Run the Go binary
CMD
["./main"]
