package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

type Response struct {
	Status  bool   `json:"status"`
	Message string `json:"message,omitempty"`
	Stream  string `json:"stream,omitempty"`
}

func streamHandler(w http.ResponseWriter, r *http.Request) {
	video := r.URL.Query().Get("video")
	format := r.URL.Query().Get("format")

	if video == "" {
		http.Error(w, `{"status":false,"message":"Missing video URL"}`, http.StatusBadRequest)
		return
	}

	url, err := GetStreamURL(video, format)
	if err != nil {
		resp := Response{Status: false, Message: err.Error()}
		json.NewEncoder(w).Encode(resp)
		return
	}

	resp := Response{Status: true, Stream: url}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func keepAlive() {
	url := os.Getenv("APP_URL")
	if url == "" {
		log.Println("No APP_URL provided, skipping keepAlive...")
		return
	}
	if !isValidURL(url) {
		log.Println("Invalid APP_URL format, skipping keepAlive...")
		return
	}
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		resp, err := http.Get(url)
		if err != nil {
			log.Printf("Error pinging URL: %v\n", err)
			continue
		}
		resp.Body.Close()
	}
}

func isValidURL(url string) bool {
	return strings.HasPrefix(url, "http://") || strings.HasPrefix(url, "https://")
}

func main() {
	go keepAlive()
	http.HandleFunc("/stream", streamHandler)
	log.Println("🚀 Server running at http://localhost:10000")
	log.Fatal(http.ListenAndServe(":10000", nil)) // use port 10000 for Render
}
