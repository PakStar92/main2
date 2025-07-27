package main

import (
	"fmt"
	"log"
)

func main() {
	streamURL, err := downloader.GetStreamURL("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "mp4")
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Stream URL:", streamURL)
}
