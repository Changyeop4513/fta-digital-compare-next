// 수록 조문 전건(articles.json)을 「FTA 협정」 폴더의 PDF 텍스트 레이어와 자동 대조한다.
// 2026-07-29 전수 재검증(144칸)에 실제로 쓴 감사기다.
//
// 방식 — '순서를 지키는 조각 대조':
//   수록값(공백 제거)을 앞에서부터 **PDF에 실제로 있는 가장 긴 조각**으로 잘라 먹어 들어간다.
//   조각은 반드시 앞 조각이 끝난 뒤쪽에서만 찾는다(순서 보장).
//   - 끝까지 먹었다  → 글자·문장부호가 전부 원문에 순서대로 있다.
//   - 못 먹고 멈췄다 → 그 지점이 원문에 없다. 진짜 의심 지점이다.
//   쪽 사이에 끼는 쪽번호·각주는 조각 수만 늘릴 뿐 판정을 망치지 않는다.
//   (통짜 includes 비교는 쪽 걸침만으로 가짜 불일치 수십 건을 낸다 — 실측 64건)
//
// 2단계 판정:
//   부호까지 일치 실패 시, 한글·알파벳만으로 다시 대조한다.
//   숫자·문장부호를 제어문자로 내보내는 PDF(미국 국문·싱DPA 영문 일부)에서는
//   이것이 정상이며, 그 경우 부호는 OCR(ocr-lines.ps1)로 별도 확정한다.
//
// 한계:
//   - 공백을 지우고 보므로 띄어쓰기 차이는 못 잡는다(줄 끝 공백은 원리적으로 판정 불가).
//   - 영문 전체가 제어문자인 PDF(미국 전문 영문)는 포털 장별 PDF로 대조해야 한다.
//
// 사용: node scripts/verify/audit-articles.mjs [협정이름,협정이름...]
//       결과는 .verify-cache/audit.json 에 저장된다. 쪽 텍스트는 캐시되므로 재실행이 빠르다.
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '../..')
const PDF_DIR = path.join(ROOT, 'FTA 협정')
const ARTICLES = path.join(ROOT, 'src/data/articles.json')
const CACHE_DIR = path.join(ROOT, '.verify-cache')
const OUT = path.join(CACHE_DIR, 'audit.json')

const only = process.argv[2] ? process.argv[2].split(',') : null
const records = JSON.parse(fs.readFileSync(ARTICLES, 'utf8'))

// 파일명 → 협정 이름. scripts/agreement-files.mjs 와 같은 표를 쓴다.
const FILE_TO_AGREEMENT = [
  [/한-칠레/, '칠레'], [/한-EFTA/, 'EFTA'], [/한-ASEAN/, 'ASEAN'],
  [/한-인도 CEPA/, '인도'], [/한-EU DTA/, 'EU DTA'], [/한-EU/, 'EU'],
  [/한-페루/, '페루'], [/한-미국/, '미국'], [/한-튀르키예/, '튀르키예'],
  [/한-호주/, '호주'], [/한-캐나다/, '캐나다'], [/한-중국/, '중국'],
  [/한-뉴질랜드/, '뉴질랜드'], [/한-베트남/, '베트남'], [/한-콜롬비아/, '콜롬비아'],
  [/한-영국/, '영국'], [/한-중미/, '중미'], [/한-이스라엘/, '이스라엘'],
  [/한-캄보디아/, '캄보디아'], [/한-인도네시아/, '인도네시아'],
  [/한-싱가포르 DPA/, '싱가포르 DPA'], [/DEPA/, 'DEPA'],
  [/한-필리핀/, '필리핀'], [/한-UAE/, 'UAE'], [/RCEP/, 'RCEP'],
  // 미발효(서명·타결) 5개 — 2026-08 협정 확장으로 수록 대상에 포함
  [/한-에콰도르/, '에콰도르'], [/한-GCC/, 'GCC'], [/한-조지아/, '조지아'],
  [/한-말레이시아/, '말레이시아'],
]
const agreementOf = (f) => FILE_TO_AGREEMENT.find(([re]) => re.test(f))?.[1] ?? null

// 언어 판별은 파일명 **끝**을 우선한다 — 콜롬비아처럼 이름 중간에 '_kor'가 끼는
// 파일(2_kor_col_agreement_en.pdf)을 중간 표기로 판별하면 오분류된다(실제 사고).
const isEng = (f) => /(_eng|_en|_eg)\.pdf$/i.test(f) || (/_eng|_eg[_.]/i.test(f) && !/_kor|_kr[_.]/i.test(f))

const files = fs.existsSync(PDF_DIR) ? fs.readdirSync(PDF_DIR).filter((f) => f.toLowerCase().endsWith('.pdf')) : []
if (!files.length) {
  console.error(`「FTA 협정」 폴더가 없거나 비어 있습니다: ${PDF_DIR}`)
  process.exit(1)
}
const byAgreement = {}
for (const f of files) {
  const a = agreementOf(f)
  if (!a) continue
  byAgreement[a] ??= { kor: [], eng: [] }
  ;(isEng(f) ? byAgreement[a].eng : byAgreement[a].kor).push(f)
}

const norm = (s) => (s || '').replace(/\s+/g, '')
const lettersOnly = (s) => (s || '').replace(/[^가-힣A-Za-z]/g, '')

fs.mkdirSync(CACHE_DIR, { recursive: true })
const mem = new Map()
async function pagesOf(file) {
  if (mem.has(file)) return mem.get(file)
  const cf = path.join(CACHE_DIR, file.replace(/[^\w가-힣.-]/g, '_') + '.json')
  let out
  if (fs.existsSync(cf)) out = JSON.parse(fs.readFileSync(cf, 'utf8'))
  else {
    const data = new Uint8Array(fs.readFileSync(path.join(PDF_DIR, file)))
    const doc = await getDocument({ data, useSystemFonts: true }).promise
    out = []
    for (let p = 1; p <= doc.numPages; p++) {
      out.push(norm((await (await doc.getPage(p)).getTextContent()).items.map((i) => i.str).join('')))
    }
    fs.writeFileSync(cf, JSON.stringify(out), 'utf8')
  }
  mem.set(file, out)
  return out
}

function chunkMatch(needle, hay) {
  let pos = 0, from = 0, chunks = 0
  while (pos < needle.length) {
    let lo = 1, hi = needle.length - pos, best = 0, bestIdx = -1
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      const idx = hay.indexOf(needle.substr(pos, mid), from)
      if (idx >= 0) { best = mid; bestIdx = idx; lo = mid + 1 } else hi = mid - 1
    }
    if (best === 0) return { ok: false, chunks, at: pos, around: needle.substr(Math.max(0, pos - 15), 45) }
    pos += best; from = bestIdx + best; chunks++
  }
  return { ok: true, chunks }
}

// 조문이 있는 쪽을 앞 24자로 찾고, 그 쪽부터 4쪽을 이어 붙여 대조한다.
// 탐침은 이웃 쪽과 이어 붙여서도 찾는다 — 조문 첫머리가 쪽 경계에 걸치면
// 한 쪽만 봐서는 못 찾는다(말레이시아 제12.6조에서 실측된 결함).
function tryMatch(text, pgs, mapFn) {
  const t = mapFn(text)
  let best = null
  // 탐침 24자가 실패하면 12자로 줄여 다시 찾는다 — 조문 첫머리에 각주 마커가
  // 끼어 있으면(말레이시아 제4.15조 "세관 통제³") 긴 탐침이 통째로 실패한다.
  for (const probeLen of [24, 12]) {
    const probe = t.slice(0, probeLen)
    for (let i = 0; i < pgs.length; i++) {
      if (!mapFn(pgs[i] + (pgs[i + 1] ?? '')).includes(probe)) continue
      const hay = mapFn(pgs.slice(i, i + 4).join(''))
      const m = chunkMatch(t, hay)
      if (!best || (m.ok && !best.m.ok) || (m.ok && best.m.ok && m.chunks < best.m.chunks)) best = { page: i + 1, m }
      if (m.ok && m.chunks <= 6) break
    }
    if (best?.m.ok) break
  }
  return best
}

const results = []
const agreements = [...new Set(records.map((r) => r.agreement))].filter((a) => !only || only.includes(a))

for (const ag of agreements) {
  const set = byAgreement[ag]
  for (const r of records.filter((x) => x.agreement === ag)) {
    for (const [field, list] of [['text_ko', set?.kor ?? []], ['text_en', set?.eng ?? []]]) {
      const row = { agreement: ag, topic: r.topic, field, status: '', detail: '' }
      const text = r[field]
      if (!norm(text)) { row.status = '빈값'; results.push(row); continue }
      if (!list.length) { row.status = '파일없음'; results.push(row); continue }

      let hit = null
      for (const f of list) {
        const pgs = await pagesOf(f)
        if (pgs.join('').length < 200) { row.detail = `${f}: 텍스트 없음(스캔) — OCR 필요`; continue }
        const full = tryMatch(text, pgs, norm)
        if (full?.m.ok) { hit = { f, ...full, kind: '전문' }; break }
        const letters = tryMatch(text, pgs, lettersOnly)
        if (letters?.m.ok) { hit = { f, ...letters, kind: '글자만' }; break }
        if (full || letters) hit ??= { f, ...(full ?? letters), kind: '차이' }
      }

      if (!hit) row.status = row.detail ? '레이어불가' : '못찾음'
      else if (hit.kind === '전문') { row.status = '일치'; row.detail = `${hit.f} ${hit.page}쪽 · 조각 ${hit.m.chunks}` }
      else if (hit.kind === '글자만') { row.status = '글자만일치(부호는OCR)'; row.detail = `${hit.f} ${hit.page}쪽 · 조각 ${hit.m.chunks} — 이 PDF는 숫자·문장부호가 제어문자라 레이어로는 부호 검증 불가` }
      else { row.status = '★차이(글자)'; row.detail = `${hit.f} ${hit.page}쪽 · 글자 기준 ${hit.m.at}자째부터 없음: …${hit.m.around}…` }
      results.push(row)
    }
  }
  const d = results.filter((x) => x.agreement === ag)
  console.log(`${ag}: ${d.length}칸 — 일치 ${d.filter((x) => x.status === '일치').length} · 글자만 ${d.filter((x) => x.status.startsWith('글자만')).length} · 차이 ${d.filter((x) => x.status.startsWith('★')).length} · 못찾음 ${d.filter((x) => x.status === '못찾음').length}`)
  mem.clear()
}

fs.writeFileSync(OUT, JSON.stringify(results, null, 2), 'utf8')
console.log('\n=== 요약 ===')
for (const s of ['일치', '글자만일치(부호는OCR)', '★차이(글자)', '못찾음', '레이어불가', '파일없음', '빈값']) {
  const n = results.filter((x) => x.status === s).length
  if (n) console.log(`  ${s}: ${n}`)
}
console.log(`결과 저장: ${OUT}`)
