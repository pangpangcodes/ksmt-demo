import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Bridezilla - The AI Powered Workspace for Modern Wedding Planning'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const imageData = await fetch(
    new URL('../public/og-image.png', import.meta.url)
  ).then((res) => res.arrayBuffer())

  return new ImageResponse(
    (
      <img
        src={imageData as unknown as string}
        width={1200}
        height={630}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    ),
    { ...size }
  )
}
