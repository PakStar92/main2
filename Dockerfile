# Stage 1: Build the Go binary using Go 1.23
FROM golang:1.23 AS builder

WORKDIR /app

COPY . .

# Build binary
RUN go build -o main .

# Stage 2: Runtime (Ubuntu with yt-dlp and ffmpeg)
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y ffmpeg python3 python3-pip curl ca-certificates && \
    pip3 install yt-dlp && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy built Go binary from builder
COPY --from=builder /app/main .

EXPOSE 8080

# ✅ Fix: Correct CMD instruction
CMD ["./main"]
