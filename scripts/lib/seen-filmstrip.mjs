import { Buffer } from 'node:buffer'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export async function filmstrip(page, row, shots, frames, name, evidence) {
  const samples = frames.flatMap(f => f.charts.filter(c => c.id === row.id).map(c => ({ ...c, t: f.t })))
  const anchor = row.seenAt ?? samples.find(s => s.visibleRatio >= 0.5)?.t ?? samples[0].t
  const selected = Array.from({ length: 10 }, (_, i) => {
    const target = anchor - 100 + i * 1300 / 9
    return { target, shot: shots.reduce((best, shot) => !best || Math.abs(shot.t - target) < Math.abs(best.t - target) ? shot : best, null) }
  })
  const png = await page.evaluate(async ({ selected, anchor, width, height }) => {
    const canvas = document.createElement('canvas')
    canvas.width = 1500
    canvas.height = 440
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#f8fafc'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    for (let i = 0; i < selected.length; i++) {
      const { shot, target } = selected[i]
      const x = i % 5 * 300
      const y = Math.floor(i / 5) * 220
      ctx.fillStyle = '#111827'
      ctx.font = '12px sans-serif'
      ctx.fillText(`${Math.round(target - anchor)} ms / sample ${shot ? Math.round(shot.t - anchor) : 'missing'}`, x + 6, y + 16)
      if (!shot)
        continue
      if (shot.box[2] <= 0 || shot.box[3] <= 0) {
        ctx.fillText('Not rendered yet (zero-sized chart)', x + 6, y + 45)
        continue
      }
      const image = new Image()
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(shot.svg)}`
      await image.decode()
      ctx.save()
      ctx.globalAlpha = shot.opacity
      const scale = Math.min(288 / shot.box[2], 190 / shot.box[3])
      ctx.filter = `blur(${shot.blur * scale}px)`
      // Preserve viewport occlusion: a half-visible chart must look half-visible.
      ctx.beginPath()
      ctx.rect(x + 6 + Math.max(0, -shot.box[0]) * scale, y + 25 + Math.max(0, -shot.box[1]) * scale, Math.max(0, Math.min(width, shot.box[0] + shot.box[2]) - Math.max(0, shot.box[0])) * scale, Math.max(0, Math.min(height, shot.box[1] + shot.box[3]) - Math.max(0, shot.box[1])) * scale)
      ctx.clip()
      ctx.drawImage(image, x + 6, y + 25, shot.box[2] * scale, shot.box[3] * scale)
      ctx.restore()
    }
    return canvas.toDataURL('image/png').split(',')[1]
  }, { selected, anchor, width: row.width, height: row.height })
  row.filmstrip = `${name}-${row.id}.png`
  row.filmstripAnchor = row.seenAt === null ? 'first-half-visible (never fully seen)' : 'seenAt'
  await writeFile(join(evidence, row.filmstrip), Buffer.from(png, 'base64'))
}
