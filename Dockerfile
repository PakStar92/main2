FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    wget ffmpeg python3 python3-pip curl git build-essential \
    && rm -rf /var/lib/apt/lists/*

RUN wget https://go.dev/dl/go1.23.11.linux-amd64.tar.gz && \
    tar -C /usr/local -xzf go1.23.11.linux-amd64.tar.gz && \
    rm go1.23.11.linux-amd64.tar.gz

ENV PATH="/usr/local/go/bin:$PATH"

RUN pip3 install yt-dlp

WORKDIR /app
COPY . /app

# 🧪 Debugging step: show files that were copied
RUN ls -al

# ⛏️ Build your Go app
RUN go build -o main .

EXPOSE 8080

CMD ["./main"]
