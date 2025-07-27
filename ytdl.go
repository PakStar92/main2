package main

import (
	"fmt"
	"os/exec"
	"strings"
)

// StreamLinks holds the separate video/audio URLs
type StreamLinks struct {
	Video string `json:"video,omitempty"`
	Audio string `json:"audio,omitempty"`
}

// GetStreamURL returns structured video/audio stream URLs
func GetStreamURL(videoURL string, format string) (*StreamLinks, error) {
	var args []string

	switch format {
	case "mp4":
		args = []string{"-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4", "-g", videoURL}
	case "mp3", "audio":
		args = []string{"-f", "bestaudio", "-g", videoURL}
	default:
		args = []string{"-g", videoURL}
	}

	cmd := exec.Command("yt-dlp", args...)
	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("yt-dlp failed: %v", err)
	}

	urls := strings.Split(strings.TrimSpace(string(output)), "\n")
	result := &StreamLinks{}

	if len(urls) == 2 {
		result.Video = urls[0]
		result.Audio = urls[1]
	} else if strings.Contains(format, "audio") || strings.Contains(format, "mp3") {
		result.Audio = urls[0]
	} else {
		result.Video = urls[0]
	}

	return result, nil
}
