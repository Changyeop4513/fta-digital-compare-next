// 인코딩이 깨진 국문 PDF에서 원문을 3중 검산으로 복원한다. (한-영국 유형)
//
// 원리:
//  - 이런 PDF는 한글 코드만 깨졌을 뿐 **글자 수·공백·줄바꿈 위치는 정확**하다.
//    (공백은 '#', 아스키는 +3 밀려 저장돼 있다)
//  - OCR(ocr-lines.ps1 결과)은 글자를 읽지만 줄 끝 한 글자를 버리거나 오독한다.
//  - 줄 길이가 맞는 줄들에서 '깨진 글자 → 진짜 글자' 대응을 모아 **다수결**로 확정하고,
//    길이가 안 맞는 줄은 **낱말 단위로 양끝에서** 다시 맞춘다.
//  - 이렇게 채운 글자는 지어낸 것이 아니라, 같은 쪽 다른 자리에서 OCR이
//    확신 있게 읽은 같은 글자다.
//
// 반드시 지킬 것 (CLAUDE.md 「깨진 국문 PDF에서 원문을 복원할 때」):
//  - 복원 못 한 글자(〔·〕 표시)가 하나라도 남으면 수록하지 않는다.
//  - 승계 협정 등 대조할 다른 문서가 있으면 반드시 낱말 비교를 추가로 한다.
//  - 인코딩 밀림을 역산해 한글을 만들어 내지 않는다. 그것은 복원이 아니라 생성이다.
//
// 사용: node scripts/verify/reconstruct.mjs "<pdf>" <쪽번호> "<쪽폴더>/ocr_w3600.txt"
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import fs from 'node:fs'

const [file, pageNo, ocrFile] = process.argv.slice(2)
if (!file || !pageNo || !ocrFile) {
  console.error('사용: node scripts/verify/reconstruct.mjs "<pdf>" <쪽번호> "<ocr줄파일>"')
  process.exit(1)
}

const data = new Uint8Array(fs.readFileSync(file))
const doc = await getDocument({ data, useSystemFonts: true }).promise
const tc = await (await doc.getPage(Number(pageNo))).getTextContent()

const rows = []
for (const it of tc.items) {
  if (!it.str) continue
  const y = Math.round(it.transform[5])
  let row = rows.find((r) => Math.abs(r.y - y) <= 3)
  if (!row) { row = { y, items: [] }; rows.push(row) }
  row.items.push(it)
}
rows.sort((a, b) => b.y - a.y)

const unshift = (s) => [...s].map((ch) => {
  const c = ch.codePointAt(0)
  return c >= 0x23 && c <= 0x7e ? String.fromCharCode(c - 3) : ch
}).join('')

// 공백은 좌표로 짐작하지 않는다 — 진짜 공백이 '#'로 들어 있으므로 그대로 이어 붙인다.
// pdf.js가 넓은 간격에 끼워 넣는 공백은 걷어내야 길이가 OCR과 맞는다.
const all = rows
  .map((r) => r.items.sort((a, b) => a.transform[4] - b.transform[4]).map((i) => i.str).join(''))
  .filter((s) => !/^\s*\d+\s*-\s*\d+\s*$/.test(s)) // 쪽번호 줄 제거 (다른 폰트라 밀려 있지 않다)
  .map((s) => unshift(s.replace(/ /g, '')))

const lines = all.map((s) => ({ text: s.replace(/\s+$/, ''), endsWithSpace: /\s$/.test(s) }))
  .filter((l) => l.text.length > 0)

const ocr = fs.readFileSync(ocrFile, 'utf8').trim().split(/\r?\n/)
  .map((l) => (l.split('\t')[1] || '').trim()).filter(Boolean)

// ---- 대응표: 후보를 모두 세어 다수결 ----------------------------------------
const votes = new Map()
function vote(g, t) {
  if (!votes.has(g)) votes.set(g, new Map())
  const v = votes.get(g)
  v.set(t, (v.get(t) || 0) + 1)
}
for (let i = 0; i < Math.min(lines.length, ocr.length); i++) {
  const a = lines[i].text, b = ocr[i]
  if (a.length !== b.length) continue
  for (let k = 0; k < a.length; k++) {
    if (a[k] === ' ' || b[k] === ' ') continue
    vote(a[k], b[k])
  }
}
// 길이가 안 맞는 줄(OCR이 글자를 흘린 줄)은 낱말 단위로 양끝에서 맞춰 대응을 보탠다.
for (let i = 0; i < Math.min(lines.length, ocr.length); i++) {
  if (lines[i].text.length === ocr[i].length) continue
  const A = lines[i].text.split(' ').filter(Boolean)
  const B = ocr[i].split(' ').filter(Boolean)
  const pairs = []
  let l = 0
  while (l < A.length && l < B.length && A[l].length === B[l].length) { pairs.push([A[l], B[l]]); l++ }
  let r = 0
  while (r < A.length - l && r < B.length - r && A[A.length - 1 - r].length === B[B.length - 1 - r].length) {
    pairs.push([A[A.length - 1 - r], B[B.length - 1 - r]]); r++
  }
  for (const [a, b] of pairs) for (let k = 0; k < a.length; k++) vote(a[k], b[k])
}

const map = new Map()
const split = []
for (const [g, v] of votes) {
  const sorted = [...v].sort((x, y) => y[1] - x[1])
  map.set(g, sorted[0][0])
  if (sorted.length > 1) split.push(`${g} → ${sorted.map(([c, n]) => `${c}(${n}표)`).join(' / ')}`)
}
console.log(`대응표 ${map.size}자`)
console.log(split.length ? '표가 갈린 글자(다수결 채택):\n  ' + split.join('\n  ') : '표가 갈린 글자: 없음')

// ---- 복원 후 OCR과 최종 대조 -------------------------------------------------
const restored = lines.map((l) => [...l.text].map((c) => (c === ' ' ? ' ' : map.get(c) ?? `〔${c}〕`)).join(''))
console.log('\n=== 줄별 최종 대조 (복원 ↔ OCR, 다른 줄만) ===')
let diff = 0
restored.forEach((r, i) => {
  if (r === ocr[i]) return
  diff++
  console.log(`${String(i + 1).padStart(2, '0')} 복원: ${r}`)
  console.log(`   OCR : ${ocr[i] ?? '(없음)'}`)
})
console.log(`\n총 ${restored.length}줄 중 ${restored.length - diff}줄 일치 · ${diff}줄 차이`)
const unresolved = restored.join('').match(/〔.〕/g)
console.log(`복원 못 한 글자: ${unresolved ? unresolved.join(' ') + ' — 해소 전에는 수록 금지' : '없음'}`)

const outR = ocrFile.replace(/\.txt$/, '.restored.txt')
fs.writeFileSync(outR, restored.join('\n'), 'utf8')
console.log(`복원 줄 저장: ${outR}`)
