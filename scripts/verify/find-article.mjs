// 조문이 실린 쪽 번호를 찾는다.
//
// 왜 필요한가:
//   협정문 전문 PDF는 1,000쪽이 넘는 것이 흔하다. 조문 하나를 검증하려고
//   전체를 뽑으면 몇 분씩 걸리므로, 쪽을 먼저 짚고 그 쪽만 다룬다.
//
// 주의 — 여기서 크게 데인 적이 두 번 있다:
//   ① 대소문자: 협정마다 "Article 22.3"과 "ARTICLE 22.3"이 섞인다.
//      구분해서 찾으면 **있는 조항을 '없음'으로 잘못 판정**하게 된다. 그래서 무시한다.
//   ② 뒤에서 찾기(rfind): 과세·예외 조항은 협정 끝부분에 있어 빠르지만,
//      가입 의정서·부속서가 뒤에 붙은 협정에서는 **엉뚱한 개정 전 문안**을 집는다.
//      (2026-07 중미 제23.3조에서 과테말라 가입 의정서를 집은 사례)
//      의심되면 find로 앞에서부터 다시 확인할 것.
//
// 사용: node scripts/verify/find-article.mjs "<pdf>" find|rfind "<찾을문구>"
//       공백은 무시하고 맞춘다. 문구는 조문 제목보다 **본문 한 구절**이 더 정확하다.
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import fs from 'node:fs'

const [file, mode, needleArg] = process.argv.slice(2)
if (!file || !['find', 'rfind'].includes(mode) || !needleArg) {
  console.error('사용: node scripts/verify/find-article.mjs "<pdf>" find|rfind "<찾을문구>"')
  process.exit(1)
}

const needle = needleArg.replace(/\s+/g, '').toLowerCase()
const data = new Uint8Array(fs.readFileSync(file))
const doc = await getDocument({ data, useSystemFonts: true }).promise

const order = mode === 'rfind'
  ? Array.from({ length: doc.numPages }, (_, i) => doc.numPages - i)
  : Array.from({ length: doc.numPages }, (_, i) => i + 1)

const hits = []
let scanned = 0
for (const p of order) {
  scanned++
  const t = (await (await doc.getPage(p)).getTextContent()).items.map((i) => i.str).join('')
  if (t.replace(/\s+/g, '').toLowerCase().includes(needle)) {
    hits.push(p)
    if (mode === 'rfind') break // 뒤에서 찾을 때는 첫 발견에서 멈춘다
  }
}

console.log(`총 ${doc.numPages}쪽 / ${scanned}쪽 훑음 / 찾은 쪽: ${hits.length ? hits.join(', ') : '(없음)'}`)
if (mode === 'rfind' && hits.length) {
  console.log('※ rfind는 뒤에서 첫 발견이다. 부속서·가입 의정서일 수 있으니 조문 번호를 확인할 것.')
}
