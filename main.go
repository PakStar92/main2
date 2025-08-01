package main

import (
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/wader/goutubedl"
)

type StreamLinks struct {
	URL      string `json:"url"`
	FormatID string `json:"format_id"`
	Ext      string `json:"ext"`
}

type Response struct {
	Status  bool         `json:"status"`
	Message string       `json:"message,omitempty"`
	Stream  *StreamLinks `json:"stream,omitempty"`
}

func streamHandler(w http.ResponseWriter, r *http.Request) {
	video := r.URL.Query().Get("video")
	format := r.URL.Query().Get("format")
	if video == "" {
		http.Error(w, `{"status":false,"message":"Missing video URL"}`, http.StatusBadRequest)
		return
	}

	stream, err := GetStreamURL(video, format)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(Response{Status: false, Message: err.Error()})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(Response{Status: true, Stream: stream})
}

// Helper to find a format by exact FormatID from the slice
func findFormatByID(formats []goutubedl.Format, id string) *goutubedl.Format {
	for _, f := range formats {
		if f.FormatID == id {
			return &f
		}
	}
	return nil
}

// Helper to find a format whose FormatID contains the substring
func findFormatByFormatIDContains(formats []goutubedl.Format, substr string) *goutubedl.Format {
	for _, f := range formats {
		if strings.Contains(f.FormatID, substr) {
			return &f
		}
	}
	return nil
}

func GetStreamURL(videoURL string, filter string) (*StreamLinks, error) {
	goutubedl.Path = "yt-dlp" // Ensure yt-dlp is installed and in PATH

	result, err := goutubedl.New(
		context.Background(),
		videoURL,
		goutubedl.Options{
			DebugLog: log.Default(),
			// Redirect stderr from yt-dlp command to os.Stderr for logs
			StderrFn: func(cmd *exec.Cmd) io.Writer { return os.Stderr },
		},
	)
	if err != nil {
		return nil, err
	}

	if filter == "" {
		filter = "best"
	}

	format := findFormatByID(result.Info.Formats, filter)
	if format == nil {
		// fallback to first format that contains "best"
		format = findFormatByFormatIDContains(result.Info.Formats, "best")
	}

	if format == nil {
		return nil, os.ErrNotExist
	}

	return &StreamLinks{
		URL:      format.URL,
		FormatID: format.FormatID,
		Ext:      format.Ext,
	}, nil
}

func keepAlive() {
	url := os.Getenv("APP_URL")
	if url == "" || !isValidURL(url) {
		log.Println("Skipping keepAlive: no or invalid APP_URL")
		return
	}

	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		resp, err := http.Get(url)
		if err != nil {
			log.Printf("keepAlive error: %v\n", err)
			continue
		}
		resp.Body.Close()
	}
}

func isValidURL(url string) bool {
	return strings.HasPrefix(url, "http://") || strings.HasPrefix(url, "https://")
}

func main() {
	http.HandleFunc("/stream", streamHandler)
	go keepAlive()

	log.Println("🚀 Server running on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
