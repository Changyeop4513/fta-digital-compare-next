// 한 쪽의 텍스트 레이어를 '글줄 단위'로 뽑아 보여 준다.
//
// 왜 필요한가:
//   조문을 수록하기 전에 그 쪽에 뭐가 있는지 눈으로 확인하는 용도다.
//   또 인코딩이 깨진 PDF라도 글자 수·공백 구조는 이 출력으로 확인할 수 있다.
//
// 주의: 이 출력을 그대로 수록하지 말 것. 협정문 PDF 중에는 텍스트가 멀쩡해 보여도
//   문장부호를 뒤 낱말 앞으로 밀어 내보내는 것이 있다("규정한다 .그리고" — 한-인도).
//   문장부호·띄어쓰기는 반드시 OCR(ocr-lines.ps1)로 확정한다.
//
// 사용: node scripts/verify/layout-page.mjs "<pdf>" <쪽번호>
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import fs from 'node:fs'

const [file, pageNo] = process.argv.slice(2)
if (!file || !pageNo) {
  console.error('사용: node scripts/verify/layout-page.mjs "<pdf>" <쪽번호>')
  process.exit(1)
}

const data = new Uint8Array(fs.readFileSync(file))
const doc = await getDocument({ data, useSystemFonts: true }).promise
const tc = await (await doc.getPage(Number(pageNo))).getTextContent()

// y좌표가 비슷한 조각을 한 글줄로 묶고, 조각 사이 가로 간격이 넓으면 공백으로 본다.
const rows = []
for (const it of tc.items) {
  if (!it.str) continue
  const y = Math.round(it.transform[5])
  let row = rows.find((r) => Math.abs(r.y - y) <= 3)
  if (!row) { row = { y, items: [] }; rows.push(row) }
  row.items.push(it)
}
rows.sort((a, b) => b.y - a.y)

rows.forEach((row, i) => {
  row.items.sort((a, b) => a.transform[4] - b.transform[4])
  let out = ''
  let prevEnd = null
  for (const it of row.items) {
    const x = it.transform[4]
    if (prevEnd !== null && x - prevEnd > 3) out += ' '
    out += it.str
    prevEnd = x + (it.width || 0)
  }
  const bare = out.replace(/\s+/g, '')
  if (bare.length === 0) return
  console.log(`R${String(i + 1).padStart(2, '0')}\t글자${String(bare.length).padStart(3)}\t${out}`)
})
