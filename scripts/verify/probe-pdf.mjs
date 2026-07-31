// PDF가 '글자를 담고 있는지' 진단한다. 검증의 첫 단계.
//
// 왜 필요한가:
//   협정문 PDF는 상태가 세 가지로 갈리고, 각각 대응이 다르다.
//   이걸 먼저 가리지 않으면 "조항이 없다"는 잘못된 판정을 하게 된다.
//   (2026-07 CHECK v2.1에 실제로 그 사례가 있다 — 손상된 추출본에서 검색해
//    "0회"가 나온 것을 조항 부재의 근거로 적었다가 정정했다.)
//
//   ① 텍스트 정상        → 그대로 대조 (audit-articles.mjs)
//   ② 인코딩 깨짐        → 글자는 못 믿지만 글자 수·공백은 멀쩡 → reconstruct.mjs
//   ③ 스캔(텍스트 없음)  → OCR만 가능 → render-pages.ps1 + ocr-lines.ps1
//
// 사용: node scripts/verify/probe-pdf.mjs "<pdf>" [표본쪽수]
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import fs from 'node:fs'

const [file, nArg] = process.argv.slice(2)
if (!file) {
  console.error('사용: node scripts/verify/probe-pdf.mjs "<pdf>" [표본쪽수]')
  process.exit(1)
}

const sample = Number(nArg || 6)
const data = new Uint8Array(fs.readFileSync(file))
const doc = await getDocument({ data, useSystemFonts: true }).promise

let chars = 0, readable = 0
const step = Math.max(1, Math.floor(doc.numPages / sample))
const pages = []
for (let p = 1; p <= doc.numPages && pages.length < sample; p += step) pages.push(p)

for (const p of pages) {
  const t = (await (await doc.getPage(p)).getTextContent()).items.map((i) => i.str).join('')
  chars += t.length
  // '읽을 수 있는 글자' = 정상 한글·알파벳·숫자·일반 문장부호.
  // 개수가 아니라 **비율**로 봐야 한다 — 한-영국 국문처럼 본문은 전부 깨졌는데
  // 머리글·쪽번호의 영문·숫자만 멀쩡한 PDF가 있다(개수로 보면 "정상"으로 오판).
  readable += (t.match(/[가-힣A-Za-z0-9.,;:()'"“”‘’·\s-]/g) || []).length
}

const ratio = chars ? readable / chars : 0
const verdict = chars < 50 ? '③ 스캔(텍스트 없음) — OCR만 가능 (render-pages.ps1)'
  : ratio < 0.7 ? `② 인코딩 깨짐/제어문자 치환 — 레이어로는 글자 수·공백만 쓰고, 글자는 OCR·장별 PDF로 (reconstruct.mjs)`
  : '① 텍스트 정상 추출 가능'

console.log(file.split(/[\\/]/).pop())
console.log(`  ${doc.numPages}쪽 / 표본 ${pages.length}쪽`)
console.log(`  글자 ${chars} · 읽을 수 있는 글자 ${readable} (${(ratio * 100).toFixed(0)}%)`)
console.log(`  판정: ${verdict}`)
