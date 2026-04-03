import fs from 'fs'
import path from 'path'
import os from 'os'
import ytdl from '@distube/ytdl-core'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'

// Ensure we have a valid ffmpeg path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic)
}

export interface ExtractedFrame {
  timestampSeconds: number
  filePath: string
}

export interface ExtractorResult {
  framesDir: string
  frames: ExtractedFrame[]
}

/**
 * Downloads a video from YouTube and extracts frames.
 * Returns the directory containing the frames and meta-information.
 */
export async function downloadAndExtractVideo(
  url: string,
  framesPerSecond: number = 0.5 // Default: 1 frame every 2 seconds
): Promise<ExtractorResult> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'scriptbot-video-'))
  const videoPath = path.join(tmpDir, 'video.mp4')
  
  // 1. Download video (stream only video, no audio for speed)
  await new Promise<void>((resolve, reject) => {
    ytdl(url, { quality: 'lowestvideo', filter: 'videoonly' })
      .pipe(fs.createWriteStream(videoPath))
      .on('finish', resolve)
      .on('error', reject)
  })

  // 2. Extract Frames
  const frames: ExtractedFrame[] = []
  
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions([
        `-vf fps=${framesPerSecond}`,      // framerate
        '-qscale:v 2'                      // quality (1-31, lower is better)
      ])
      .output(path.join(tmpDir, 'frame_%04d.jpg'))
      .on('end', () => {
        // Collect frames
        const files = fs.readdirSync(tmpDir).filter(f => f.startsWith('frame_') && f.endsWith('.jpg'))
        files.sort() // Ensure chronological order

        files.forEach((file, index) => {
          frames.push({
            // Approximation: index / framerate = seconds
            timestampSeconds: Math.floor(index / framesPerSecond),
            filePath: path.join(tmpDir, file)
          })
        })

        resolve({ framesDir: tmpDir, frames })
      })
      .on('error', (err: Error) => {
        reject(err)
      })
      .run()
  })
}
