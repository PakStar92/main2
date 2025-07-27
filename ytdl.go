package main

import (
	"fmt"
	"os/exec"
	"strings"
)

// GetStreamURL returns the direct media stream URL using yt-dlp
func GetStreamURL(videoURL string, format string) (string, error) {
	var args []string

	switch format {
	case "mp4":
		args = []string{"-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4", "-g", videoURL}
	case "mp3", "audio":
		args = []string{"-f", "bestaudio", "-g", videoURL}
	default:
		args = []string{"-g", videoURL} // fallback
	}

	cmd := exec.Command("yt-dlp", args...)
	output, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("yt-dlp failed: %v", err)
	}

	// Output may be one or two lines: video and audio URLs
	urls := strings.Split(strings.TrimSpace(string(output)), "\n")
	return strings.Join(urls, " "), nil
			}
