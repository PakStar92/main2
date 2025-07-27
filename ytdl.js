/**
 * YouTube Video & Audio Downloader Package
 * A comprehensive JavaScript package for downloading YouTube videos and audio
 * Inspired by yt1s.ltd functionality
 */

const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

class YouTubeDownloader {
    constructor(options = {}) {
        this.options = {
            outputDir: options.outputDir || './downloads',
            quality: options.quality || 'highest',
            format: options.format || 'mp4',
            ...options
        };
        
        // Ensure output directory exists
        this.ensureOutputDir();
    }

    /**
     * Ensure the output directory exists
     */
    ensureOutputDir() {
        if (!fs.existsSync(this.options.outputDir)) {
            fs.mkdirSync(this.options.outputDir, { recursive: true });
        }
    }

    /**
     * Validate YouTube URL
     * @param {string} url - YouTube URL to validate
     * @returns {boolean} - True if valid YouTube URL
     */
    isValidYouTubeUrl(url) {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    return youtubeRegex.test(url);
 
    }

    /**
     * Get video information
     * @param {string} url - YouTube video URL
     * @returns {Promise<Object>} - Video information
     */
    async getVideoInfo(url) {
        try {
            if (!this.isValidYouTubeUrl(url)) {
                throw new Error('Invalid YouTube URL');
            }

            const info = await ytdl.getInfo(url);
            return {
                title: info.videoDetails.title,
                duration: info.videoDetails.lengthSeconds,
                views: info.videoDetails.viewCount,
                author: info.videoDetails.author.name,
                description: info.videoDetails.description,
                thumbnails: info.videoDetails.thumbnails,
                formats: info.formats
            };
        } catch (error) {
            throw new Error(`Failed to get video info: ${error.message}`);
        }
    }

    /**
     * Get available quality options
     * @param {string} url - YouTube video URL
     * @returns {Promise<Array>} - Available quality options
     */
    async getAvailableQualities(url) {
        try {
            const info = await ytdl.getInfo(url);
            const qualities = new Set();
            
            info.formats.forEach(format => {
                if (format.height) {
                    qualities.add(`${format.height}p`);
                }
                if (format.qualityLabel) {
                    qualities.add(format.qualityLabel);
                }
            });

            return Array.from(qualities).sort((a, b) => {
                const aNum = parseInt(a);
                const bNum = parseInt(b);
                return bNum - aNum;
            });
        } catch (error) {
            throw new Error(`Failed to get qualities: ${error.message}`);
        }
    }

    /**
     * Download video in MP4 format
     * @param {string} url - YouTube video URL
     * @param {Object} options - Download options
     * @returns {Promise<string>} - Path to downloaded file
     */
    async downloadVideo(url, options = {}) {
        return new Promise((resolve, reject) => {
            try {
                if (!this.isValidYouTubeUrl(url)) {
                    return reject(new Error('Invalid YouTube URL'));
                }

                const quality = options.quality || this.options.quality;
                const format = options.format || 'mp4';
                
                ytdl.getInfo(url).then(info => {
                    const title = this.sanitizeFilename(info.videoDetails.title);
                    const filename = `${title}.${format}`;
                    const filepath = path.join(this.options.outputDir, filename);

                    const videoOptions = {
                        quality: quality === 'highest' ? 'highestvideo' : quality,
                        filter: format => format.container === 'mp4'
                    };

                    const stream = ytdl(url, videoOptions);
                    const writeStream = fs.createWriteStream(filepath);

                    stream.pipe(writeStream);

                    let downloadedBytes = 0;
                    stream.on('progress', (chunkLength, downloaded, total) => {
                        downloadedBytes = downloaded;
                        const percent = (downloaded / total * 100).toFixed(2);
                        if (options.onProgress) {
                            options.onProgress({
                                percent: parseFloat(percent),
                                downloaded,
                                total
                            });
                        }
                    });

                    writeStream.on('finish', () => {
                        resolve(filepath);
                    });

                    stream.on('error', reject);
                    writeStream.on('error', reject);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Download audio in MP3 format
     * @param {string} url - YouTube video URL
     * @param {Object} options - Download options
     * @returns {Promise<string>} - Path to downloaded file
     */
    async downloadAudio(url, options = {}) {
        return new Promise((resolve, reject) => {
            try {
                if (!this.isValidYouTubeUrl(url)) {
                    return reject(new Error('Invalid YouTube URL'));
                }

                const quality = options.quality || 'highestaudio';
                const bitrate = options.bitrate || '320k';
                
                ytdl.getInfo(url).then(info => {
                    const title = this.sanitizeFilename(info.videoDetails.title);
                    const filename = `${title}.mp3`;
                    const filepath = path.join(this.options.outputDir, filename);

                    const audioOptions = {
                        quality: quality,
                        filter: 'audioonly'
                    };

                    const stream = ytdl(url, audioOptions);
                    
                    ffmpeg(stream)
                        .audioBitrate(bitrate)
                        .save(filepath)
                        .on('progress', (progress) => {
                            if (options.onProgress) {
                                options.onProgress({
                                    percent: progress.percent || 0,
                                    timemark: progress.timemark
                                });
                            }
                        })
                        .on('end', () => {
                            resolve(filepath);
                        })
                        .on('error', reject);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Download video with multiple quality options
     * @param {string} url - YouTube video URL
     * @param {Array} qualities - Array of qualities to download
     * @returns {Promise<Array>} - Array of downloaded file paths
     */
    async downloadMultipleQualities(url, qualities = ['720p', '1080p']) {
        const downloads = [];
        
        for (const quality of qualities) {
            try {
                const filepath = await this.downloadVideo(url, { quality });
                downloads.push({ quality, filepath });
            } catch (error) {
                downloads.push({ quality, error: error.message });
            }
        }
        
        return downloads;
    }

    /**
     * Convert video to different format
     * @param {string} inputPath - Input video file path
     * @param {string} outputFormat - Output format (mp4, avi, mkv, etc.)
     * @returns {Promise<string>} - Path to converted file
     */
    async convertVideo(inputPath, outputFormat) {
        return new Promise((resolve, reject) => {
            const outputPath = inputPath.replace(path.extname(inputPath), `.${outputFormat}`);
            
            ffmpeg(inputPath)
                .output(outputPath)
                .on('end', () => resolve(outputPath))
                .on('error', reject)
                .run();
        });
    }

    /**
     * Extract thumbnail from video
     * @param {string} url - YouTube video URL
     * @param {Object} options - Thumbnail options
     * @returns {Promise<string>} - Path to thumbnail file
     */
    async downloadThumbnail(url, options = {}) {
        try {
            const info = await this.getVideoInfo(url);
            const thumbnail = info.thumbnails[info.thumbnails.length - 1]; // Get highest quality thumbnail
            
            const title = this.sanitizeFilename(info.title);
            const filename = `${title}_thumbnail.jpg`;
            const filepath = path.join(this.options.outputDir, filename);
            
            const response = await fetch(thumbnail.url);
            const buffer = await response.arrayBuffer();
            
            fs.writeFileSync(filepath, Buffer.from(buffer));
            return filepath;
        } catch (error) {
            throw new Error(`Failed to download thumbnail: ${error.message}`);
        }
    }

    /**
     * Batch download multiple videos
     * @param {Array} urls - Array of YouTube URLs
     * @param {Object} options - Download options
     * @returns {Promise<Array>} - Array of download results
     */
    async batchDownload(urls, options = {}) {
        const results = [];
        
        for (const url of urls) {
            try {
                let filepath;
                if (options.type === 'audio') {
                    filepath = await this.downloadAudio(url, options);
                } else {
                    filepath = await this.downloadVideo(url, options);
                }
                results.push({ url, filepath, success: true });
            } catch (error) {
                results.push({ url, error: error.message, success: false });
            }
        }
        
        return results;
    }

    /**
     * Get download statistics
     * @returns {Object} - Download statistics
     */
    getStats() {
        const files = fs.readdirSync(this.options.outputDir);
        const totalFiles = files.length;
        let totalSize = 0;
        
        files.forEach(file => {
            const filePath = path.join(this.options.outputDir, file);
            const stats = fs.statSync(filePath);
            totalSize += stats.size;
        });
        
        return {
            totalFiles,
            totalSize: this.formatBytes(totalSize),
            outputDir: this.options.outputDir
        };
    }

    /**
     * Clean up downloaded files
     * @param {number} olderThanDays - Delete files older than specified days
     */
    cleanup(olderThanDays = 7) {
        const files = fs.readdirSync(this.options.outputDir);
        const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
        
        files.forEach(file => {
            const filePath = path.join(this.options.outputDir, file);
            const stats = fs.statSync(filePath);
            
            if (stats.mtime.getTime() < cutoffTime) {
                fs.unlinkSync(filePath);
            }
        });
    }

    /**
     * Sanitize filename for safe file system usage
     * @param {string} filename - Original filename
     * @returns {string} - Sanitized filename
     */
    sanitizeFilename(filename) {
        return filename
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '_')     // Replace spaces with underscores
            .substring(0, 100);       // Limit length
    }

    /**
     * Format bytes to human readable format
     * @param {number} bytes - Bytes to format
     * @returns {string} - Formatted string
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Usage Examples and Export
module.exports = YouTubeDownloader;

// Example usage:
/*
const downloader = new YouTubeDownloader({
    outputDir: './my_downloads',
    quality: 'highest'
});

// Download video
downloader.downloadVideo('https://www.youtube.com/watch?v=VIDEO_ID', {
    quality: '1080p',
    onProgress: (progress) => {
        console.log(`Downloaded: ${progress.percent}%`);
    }
}).then(filepath => {
    console.log('Video downloaded:', filepath);
}).catch(console.error);

// Download audio
downloader.downloadAudio('https://www.youtube.com/watch?v=VIDEO_ID', {
    bitrate: '320k',
    onProgress: (progress) => {
        console.log(`Converting: ${progress.percent}%`);
    }
}).then(filepath => {
    console.log('Audio downloaded:', filepath);
}).catch(console.error);

// Get video info
downloader.getVideoInfo('https://www.youtube.com/watch?v=VIDEO_ID')
    .then(info => console.log(info))
    .catch(console.error);

// Batch download
const urls = [
    'https://www.youtube.com/watch?v=VIDEO_ID1',
    'https://www.youtube.com/watch?v=VIDEO_ID2'
];

downloader.batchDownload(urls, { type: 'audio' })
    .then(results => console.log(results))
    .catch(console.error);
*/
