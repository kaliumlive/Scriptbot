import { getFFmpeg } from './ffmpeg-client'
import { fetchFile } from '@ffmpeg/util'

export async function extractFrames(
    videoUrl: string,
    count: number = 10,
    brandId: string
): Promise<string[]> {
    const ffmpeg = await getFFmpeg()

    // Read video from URL
    await ffmpeg.writeFile('input.mp4', await fetchFile(videoUrl))

    // Extract duration first
    // ffmpeg -i input.mp4 2>&1 | grep "Duration"
    // For simplicity, we'll assume we want frames spread across the video

    const framePaths: string[] = []

    for (let i = 0; i < count; i++) {
        const time = i * 2 // Every 2 seconds for example, should be dynamic
        const outputName = `frame_${i}.jpg`

        await ffmpeg.exec([
            '-ss', time.toString(),
            '-i', 'input.mp4',
            '-frames:v', '1',
            '-q:v', '2',
            outputName
        ])

        const data = await ffmpeg.readFile(outputName)
        // Here we'd typically upload to Supabase Storage
        // const { data: uploadData } = await supabase.storage.from('frames').upload(...)
        // For now, return base64 for immediate analysis or storage path
        const base64 = Buffer.from(data as Uint8Array).toString('base64')
        framePaths.push(`data:image/jpeg;base64,${base64}`)
    }

    return framePaths
}
