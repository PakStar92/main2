FROM golang:1.23.11

# Install dependencies
RUN apt-get update && \
    apt-get install -y ffmpeg python3 python3-pip curl && \
    pip3 install yt-dlp && \
    apt-get clean

# Set working directory
WORKDIR /app

# Copy and build Go app
COPY . .
RUN go build -o main .

# Expose port
EXPOSE 8080

# Run the server
CMD ["./main"]
