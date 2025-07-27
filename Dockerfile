# Use Ubuntu base with Go 1.23
FROM golang:1.23

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    curl \
    && pip3 install yt-dlp \
    && apt-get clean

# Set working directory
WORKDIR /app

# Copy project files
COPY . .

# Build the Go app
RUN go build -o main .

# Expose the port your app runs on
EXPOSE 8080

# Command to run the binary
CMD ["./main"]
