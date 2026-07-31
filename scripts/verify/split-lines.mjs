// render-pages.ps1이 만든 쪽 그림(w2400·w3600·w4800)을 '글줄' 단위로 잘라 낸다.
//
// 왜 글줄로 쪼개나:
//   Windows OCR은 쪽 전체를 한 번에 읽으면 **줄 끝에 홀로 떨어진 한 글자를 통째로 버린다.**
//   (한-영국 제15.7조의 "부여하는 데"의 '데'가 배율과 무관하게 똑같이 빠졌던 사례)
//   한 줄만 담긴 그림을 주면 그 줄을 정상 문장으로 읽는다.
//
// 방법: 가로 방향으로 검은 픽셀 수를 세어(잉크 프로파일) 글자가 있는 구간을 글줄로 본다.
//
// 사용: node scripts/verify/split-lines.mjs "<쪽폴더>" [...]
//   쪽폴더는 render-pages.ps1의 출력(p0000 형태). 안에 lines_w2400/ 등이 생긴다.
import { createCanvas, loadImage } from '@napi-rs/canvas'
import fs from 'node:fs'
import path from 'node:path'

const dirs = process.argv.slice(2)
if (!dirs.length) {
  console.error('사용: node scripts/verify/split-lines.mjs "<쪽폴더>" [...]')
  process.exit(1)
}

async function split(png, outDir) {
  const img = await loadImage(png)
  const c = createCanvas(img.width, img.height)
  const cx = c.getContext('2d')
  cx.drawImage(img, 0, 0)
  const { data } = cx.getImageData(0, 0, img.width, img.height)

  const ink = new Array(img.height).fill(0)
  for (let y = 0; y < img.height; y++) {
    let n = 0
    const b = y * img.width * 4
    for (let x = 0; x < img.width; x++) {
      const i = b + x * 4
      if (data[i] < 128 && data[i + 1] < 128 && data[i + 2] < 128) n++
    }
    ink[y] = n
  }
  // 얇은 틈(자모 사이)은 같은 글줄로 이어 붙이고, 너무 얇은 조각(점·얼룩)은 버린다.
  const GAP = Math.round(img.height * 0.004)
  const bands = []
  let start = -1, blank = 0
  for (let y = 0; y < img.height; y++) {
    if (ink[y] > 0) { if (start < 0) start = y; blank = 0 }
    else if (start >= 0) { blank++; if (blank > GAP) { bands.push([start, y - blank]); start = -1; blank = 0 } }
  }
  if (start >= 0) bands.push([start, img.height - 1])
  const lines = bands.filter(([a, b]) => b - a >= Math.round(img.height * 0.008))

  fs.mkdirSync(outDir, { recursive: true })
  const PAD = 60 // 여백 — 글자가 가장자리에 붙어 있으면 OCR이 놓친다
  lines.forEach(([a, b], i) => {
    const h = b - a + 1
    const cv = createCanvas(img.width + PAD * 2, h + PAD * 2)
    const q = cv.getContext('2d')
    q.fillStyle = '#ffffff'
    q.fillRect(0, 0, cv.width, cv.height)
    q.drawImage(img, 0, a, img.width, h, PAD, PAD, img.width, h)
    fs.writeFileSync(path.join(outDir, `L${String(i + 1).padStart(2, '0')}.png`), cv.toBuffer('image/png'))
  })
  return lines.length
}

for (const dir of dirs) {
  for (const w of [2400, 3600, 4800]) {
    const png = path.join(dir, `w${w}.png`)
    if (!fs.existsSync(png)) { console.log(`건너뜀(그림 없음): ${png}`); continue }
    const n = await split(png, path.join(dir, `lines_w${w}`))
    console.log(`${path.basename(dir)} w${w}: 글줄 ${n}개`)
  }
}
