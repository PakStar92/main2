FROM golang:1.23.11-bullseye

RUN apt-get update && apt-get install -y python3 python3-pip ffmpeg && \
    pip3 install yt-dlp && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

RUN go mod tidy

RUN go build -o main .

EXPOSE 8080
CMD ["./main"]
