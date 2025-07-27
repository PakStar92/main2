const YouTubeDownloader = require('./ytdl.js')
const downloader = new YouTubeDownloader({
    outputDir: './downloads',
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
