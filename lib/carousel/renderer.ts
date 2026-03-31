import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium-min'

export async function renderSlides(
    slides: Array<{ title: string; content: string; imageUrl?: string }>,
    _brandId: string
): Promise<string[]> {
    const isProd = process.env.NODE_ENV === 'production'

    const browser = await puppeteer.launch({
        args: isProd ? chromium.args : [],
        defaultViewport: { width: 1080, height: 1080 },
        executablePath: isProd
            ? await chromium.executablePath()
            : 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Standard Windows path
        headless: true,
    })

    const page = await browser.newPage()
    const imageUrls: string[] = []

    for (let i = 0; i < slides.length; i++) {
        const slide = slides[i]

        // Simple HTML template for the slide
        const html = `
      <html>
        <style>
          body { 
            margin: 0; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center; 
            height: 1080px; 
            width: 1080px; 
            background: #09090b; 
            color: white; 
            font-family: sans-serif; 
            padding: 80px;
            text-align: center;
          }
          h1 { font-size: 64px; margin-bottom: 40px; }
          p { font-size: 32px; color: #a1a1aa; line-height: 1.5; }
          .image { width: 100%; height: 500px; object-fit: cover; border-radius: 20px; margin-bottom: 40px; }
        </style>
        <body>
          ${slide.imageUrl ? `<img src="${slide.imageUrl}" class="image" />` : ''}
          <h1>${slide.title}</h1>
          <p>${slide.content}</p>
        </body>
      </html>
    `

        await page.setContent(html)
        const buffer = await page.screenshot({ type: 'png' })

        // In a real app, upload to Supabase Storage
        // For now, return base64
        const base64 = Buffer.from(buffer).toString('base64')
        imageUrls.push(`data:image/png;base64,${base64}`)
    }

    await browser.close()
    return imageUrls
}
