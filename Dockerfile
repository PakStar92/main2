# Use latest Go image
FROM golang:1.21-alpine

# Install yt-dlp
RUN apk add --no-cache ffmpeg python3 py3-pip curl \
 && pip3 install yt-dlp

# Set working dir
WORKDIR /app

# Copy and build
COPY . .
RUN go build -o main .

# Expose port
EXPOSE 8080

# Run
CMD ["./main"]
