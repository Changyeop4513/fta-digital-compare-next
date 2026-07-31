// OCR 결과(배율 3종)와 수록 조문을 **낱말 단위 LCS**로 비교해 다른 곳만 보고한다.
//
// 절차:
//  1) 쪽폴더의 ocr_w2400/3600/4800.txt 를 읽어 줄마다 다수결(2/3)로 확정한다.
//  2) 지정한 조문의 수록값과 낱말 단위로 정렬해 차이 나는 덩어리만 출력한다.
//     쪽 하단의 각주·이웃 조문은 'OCR쪽에만 있는 낱말 뭉치'로 깔끔하게 분리된다.
//     (조각 대조는 각주 본문에 걸려 헛돈다 — 그래서 여기서는 LCS를 쓴다)
//
// 차이를 읽는 법 — OCR 오독의 유형이 일정하므로 이것부터 의심한다:
//   · 줄 끝 쉼표를 `/`로 읽는다 (활자 확대로 쉼표임을 확인한 사례 다수)
//   · 가운뎃점 `·`을 `•`로 읽는다
//   · 낱말 중간에 공백을 끼워 넣는다
//   · 영문을 한국어 엔진으로 읽으면 o→0, l→1
//   · 각주 번호(1) 2) …)는 원문에 있고 수록값에 없는 것이 **정상**이다(PRD 9-4)
//   이 유형이 아닌 차이만이 진짜 의심 지점이며, 해당 글줄 그림(lines_w*/L**.png)을
//   직접 열어 활자를 확인해 판정한다.
//
// 사용: node scripts/verify/compare-ocr.mjs <협정> <topic> <text_ko|text_en> "<쪽폴더>" [...]
import fs from 'node:fs'
import path from 'node:path'

const [agreement, topic, field, ...pageDirs] = process.argv.slice(2)
if (!agreement || !topic || !['text_ko', 'text_en'].includes(field) || !pageDirs.length) {
  console.error('사용: node scripts/verify/compare-ocr.mjs <협정> <topic> <text_ko|text_en> "<쪽폴더>" [...]')
  process.exit(1)
}

const ROOT = path.resolve(import.meta.dirname, '../..')
const records = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/articles.json'), 'utf8'))
const rec = records.find((r) => r.agreement === agreement && r.topic === topic)
if (!rec) { console.error(`기록 없음: ${agreement} / ${topic}`); process.exit(1) }

const load = (f) => fs.existsSync(f)
  ? fs.readFileSync(f, 'utf8').trim().split(/\r?\n/).map((l) => (l.split('\t')[1] || '').trim())
  : null

function majorityLines(dir) {
  const scales = [2400, 3600, 4800].map((w) => load(path.join(dir, `ocr_w${w}.txt`))).filter(Boolean)
  if (!scales.length) { console.error(`OCR 결과 없음: ${dir} — ocr-lines.ps1을 먼저 돌릴 것`); process.exit(1) }
  const n = Math.max(...scales.map((s) => s.length))
  const out = []
  for (let i = 0; i < n; i++) {
    const votes = scales.map((s) => s[i] ?? '')
    const win = votes.find((v) => votes.filter((x) => x === v).length >= 2)
    out.push(win !== undefined ? win : votes[0])
  }
  return out
}

function lcsDiff(a, b) {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1))
  for (let i = m - 1; i >= 0; i--) for (let j = n - 1; j >= 0; j--)
    dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  const ops = []
  let i = 0, j = 0
  while (i < m && j < n) {
    if (a[i] === b[j]) { ops.push(['=', a[i]]); i++; j++ }
    else if (dp[i + 1][j] >= dp[i][j + 1]) ops.push(['-', a[i++]])
    else ops.push(['+', b[j++]])
  }
  while (i < m) ops.push(['-', a[i++]])
  while (j < n) ops.push(['+', b[j++]])
  return ops
}

const recWords = rec[field].split(/\s+/).filter(Boolean)
const ocrWords = pageDirs.flatMap((d) => majorityLines(d)).join(' ').split(/\s+/).filter(Boolean)
const ops = lcsDiff(recWords, ocrWords)

console.log(`${agreement} ${topic} ${field} — 수록 ${recWords.length}낱말 / OCR ${ocrWords.length}낱말`)
let shown = 0
for (let k = 0; k < ops.length; k++) {
  if (ops[k][0] === '=') continue
  const start = k
  while (k < ops.length && ops[k][0] !== '=') k++
  const del = ops.slice(start, k).filter((o) => o[0] === '-').map((o) => o[1])
  const add = ops.slice(start, k).filter((o) => o[0] === '+').map((o) => o[1])
  const before = ops.slice(0, start).filter((o) => o[0] === '=').slice(-2).map((o) => o[1]).join(' ')
  const after = ops.slice(k).filter((o) => o[0] === '=').slice(0, 2).map((o) => o[1]).join(' ')
  if (del.length === 0 && add.length > 20) {
    console.log(`  (OCR쪽에만 ${add.length}낱말 — 각주/이웃 조문으로 추정: "${add.slice(0, 5).join(' ')} … ${add.slice(-3).join(' ')}")`)
    continue
  }
  shown++
  console.log(`  ★ [${before}] 다음`)
  if (del.length) console.log(`     수록: ${del.join(' ')}`)
  if (add.length) console.log(`     OCR : ${add.join(' ')}`)
  console.log(`     [${after}] 앞`)
}
if (shown === 0) console.log('  ✓ 낱말 단위 차이 없음 (각주/이웃 조문 제외)')
