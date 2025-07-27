package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os/exec"
)

type DownloadRequest struct {
	URL    string `json:"url"`
	Format string `json:"format"` // e.g. "mp3", "mp4"
}

type JsonResponse struct {
	Status  bool   `json:"status"`
	Message string `json:"message"`
	Output  string `json:"output,omitempty"`
}

func downloadHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}

	var req DownloadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.URL == "" || req.Format == "" {
		http.Error(w, "Missing 'url' or 'format'", http.StatusBadRequest)
		return
	}

	var args []string
	switch req.Format {
	case "mp3":
		args = []string{"-x", "--audio-format", "mp3", "-o", "downloads/%(title)s.%(ext)s", req.URL}
	case "mp4":
		args = []string{"-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4", "-o", "downloads/%(title)s.%(ext)s", req.URL}
	default:
		http.Error(w, "Unsupported format", http.StatusBadRequest)
		return
	}

	cmd := exec.Command("yt-dlp", args...)

	output, err := cmd.CombinedOutput()
	if err != nil {
		log.Println("yt-dlp error:", err)
		json.NewEncoder(w).Encode(JsonResponse{
			Status:  false,
			Message: "yt-dlp failed: " + err.Error(),
			Output:  string(output),
		})
		return
	}

	json.NewEncoder(w).Encode(JsonResponse{
		Status:  true,
		Message: "Download complete",
		Output:  string(output),
	})
}

func main() {
	http.HandleFunc("/download", downloadHandler)
	log.Println("Server started at :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
    }
