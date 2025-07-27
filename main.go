package main

import (
	"encoding/json"
	"log"
	"net/http"
)

type Response struct {
	Status  bool   `json:"status"`
	Message string `json:"message,omitempty"`
	Stream  string `json:"stream,omitempty"`
}

// Handler for /stream?video=...&format=...
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

func main() {
	http.HandleFunc("/stream", streamHandler)

	log.Println("🚀 Server running at http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
