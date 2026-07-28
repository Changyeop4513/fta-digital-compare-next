// 협정문 원본 PDF의 "지문"을 기록하고, 나중에 바뀐 파일을 찾아내는 도구.
//
// 왜 필요한가:
//   FTA 개선협상으로 협정문이 개정되면 「FTA 협정」 폴더의 PDF를 새 파일로 갈아끼우게 된다.
//   그런데 이미 수록한 조항(articles.json)은 그대로 남으므로, 아무 조치를 안 하면
//   **화면에는 옛 조문이 계속 보이는데 근거 파일은 새 것**인 상태가 된다.
//   원문 무결성이 이 앱의 전부이므로, 파일이 바뀐 사실을 반드시 알아채야 한다.
//
// PDF 자체는 용량이 커서 저장소에 넣지 않는다(.gitignore). 대신 이 지문 파일만 커밋한다.
//
// 사용법:
//   node scripts/agreement-files.mjs save    지금 폴더 상태를 지문으로 기록(최초 1회 / 갱신 확인 후)
//   node scripts/agreement-files.mjs check   지문과 대조해 바뀐 협정과 영향받는 조항을 보고
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const ROOT = path.resolve(import.meta.dirname, '..')
const PDF_DIR = path.join(ROOT, 'FTA 협정')
const MANIFEST = path.join(ROOT, 'agreement-manifest.json')
const ARTICLES = path.join(ROOT, 'src/data/articles.json')

// 파일명 앞의 번호와 협정 이름으로 데이터의 agreement 값(상대국명)을 찾아 잇는다.
// 목적: 파일이 바뀌었을 때 "어느 협정의 몇 건이 영향을 받는지" 바로 알려주기 위함.
const FILE_TO_AGREEMENT = [
  [/한-칠레/, '칠레'], [/한-EFTA/, 'EFTA'], [/한-ASEAN/, 'ASEAN'],
  [/한-인도 CEPA/, '인도'], [/한-EU DTA/, null], [/한-EU/, 'EU'],
  [/한-페루/, '페루'], [/한-미국/, '미국'], [/한-튀르키예/, '튀르키예'],
  [/한-호주/, '호주'], [/한-캐나다/, '캐나다'], [/한-중국/, '중국'],
  [/한-뉴질랜드/, '뉴질랜드'], [/한-베트남/, '베트남'], [/한-콜롬비아/, '콜롬비아'],
  [/한-영국/, '영국'], [/한-중미/, '중미'], [/한-이스라엘/, '이스라엘'],
  [/한-캄보디아/, '캄보디아'], [/한-인도네시아/, '인도네시아'],
  [/한-싱가포르 DPA/, '싱가포르 DPA'], [/DEPA/, 'DEPA'],
  [/한-필리핀/, '필리핀'], [/한-UAE/, 'UAE'], [/RCEP/, 'RCEP'],
]

function agreementOf(fileName) {
  for (const [re, name] of FILE_TO_AGREEMENT) if (re.test(fileName)) return name
  return null // 미발효 서명 협정(에콰도르·GCC·조지아·말레이시아 등)과 대상 외 파일
}

function scan() {
  if (!fs.existsSync(PDF_DIR)) {
    console.error(`「FTA 협정」 폴더가 없습니다: ${PDF_DIR}`)
    process.exit(1)
  }
  return fs
    .readdirSync(PDF_DIR)
    .filter((f) => f.toLowerCase().endsWith('.pdf'))
    .sort()
    .map((f) => {
      const full = path.join(PDF_DIR, f)
      const buf = fs.readFileSync(full)
      return {
        file: f,
        agreement: agreementOf(f),
        bytes: buf.length,
        sha256: crypto.createHash('sha256').update(buf).digest('hex'),
      }
    })
}

const mode = process.argv[2]

if (mode === 'save') {
  const files = scan()
  // 기록 시점은 사람이 직접 적는다 — 실행할 때마다 바뀌면 무의미한 차이가 생긴다.
  const stamp = process.argv[3] || '(날짜 미기재)'
  fs.writeFileSync(
    MANIFEST,
    JSON.stringify({ 확인일: stamp, 파일수: files.length, files }, null, 2) + '\n',
    'utf8'
  )
  const covered = new Set(files.map((f) => f.agreement).filter(Boolean))
  console.log(`지문 ${files.length}개 기록 → ${path.basename(MANIFEST)}`)
  console.log(`대상 협정 연결: ${covered.size}개`)
  process.exit(0)
}

if (mode !== 'check') {
  console.log('사용법: node scripts/agreement-files.mjs save|check')
  process.exit(1)
}

if (!fs.existsSync(MANIFEST)) {
  console.error(`지문 파일이 없습니다. 먼저 save 를 실행하세요: ${MANIFEST}`)
  process.exit(1)
}

const saved = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))
const now = scan()
const byName = (list) => new Map(list.map((f) => [f.file, f]))
const before = byName(saved.files)
const after = byName(now)

const changed = []
const added = []
const removed = []

for (const [name, f] of after) {
  const b = before.get(name)
  if (!b) added.push(f)
  else if (b.sha256 !== f.sha256) changed.push({ ...f, 이전바이트: b.bytes })
}
for (const [name, f] of before) if (!after.has(name)) removed.push(f)

console.log(`지문 기록 시점: ${saved.확인일}  (기록 ${saved.파일수}개 / 현재 ${now.length}개)`)

if (!changed.length && !added.length && !removed.length) {
  console.log('\n변화 없음 — 수록 조항의 근거 파일이 그대로입니다.')
  process.exit(0)
}

const articles = fs.existsSync(ARTICLES) ? JSON.parse(fs.readFileSync(ARTICLES, 'utf8')) : []
const affected = new Set()

const report = (title, list, mark) => {
  if (!list.length) return
  console.log(`\n${title} (${list.length}건)`)
  for (const f of list) {
    const a = f.agreement ? `→ ${f.agreement}` : '(대상 협정 아님)'
    console.log(`  ${mark} ${f.file}  ${a}`)
    if (f.agreement) affected.add(f.agreement)
  }
}

report('내용이 바뀐 파일', changed, '변경')
report('새로 들어온 파일', added, '추가')
report('사라진 파일', removed, '삭제')

// 영향받는 수록 조항이 실제로 있을 때만 처리 절차를 안내한다.
// (협정은 대상이지만 아직 수록 조항이 0건인 경우가 있다 — 예: 3주제 모두 '없음'인 협정에
//  파일이 추가된 경우. 이때 재검증 절차를 띄우면 할 일이 있는 것처럼 보여 오해를 준다)
const affectedRows = [...affected]
  .sort()
  .map((ag) => ({ ag, rows: articles.filter((x) => x.agreement === ag) }))
const total = affectedRows.reduce((n, x) => n + x.rows.length, 0)

if (total > 0) {
  console.log('\n다시 검증해야 할 수록 조항')
  for (const { ag, rows } of affectedRows) {
    console.log(`  ${ag}: ${rows.length}건`)
    for (const r of rows) console.log(`     - [${r.topic}] ${r.article_no}`)
  }
  console.log(`\n합계 ${total}건. 아래 순서로 처리하세요.`)
  console.log('  1) 바뀐 협정문에서 해당 조문을 다시 추출한다')
  console.log('  2) 수록된 text_en/text_ko 와 대조한다 (글자가 달라졌는지)')
  console.log('  3) 달라졌으면 원문을 갈아끼우고 baseline_date·source 를 새 기준으로 고친다')
  console.log('  4) CHECK.md 에 개정 반영 사실을 남긴다')
  console.log('  5) node scripts/agreement-files.mjs save "YYYY-MM-DD" 로 지문을 갱신한다')
} else if (affected.size) {
  // 대상 협정이긴 한데 수록 조항이 0건인 경우 (예: 3주제 모두 '없음'으로 확정한 협정)
  console.log(
    `\n영향받는 수록 조항 없음 — ${[...affected].sort().join(' · ')}는 현재 수록 조항이 0건입니다.`
  )
  console.log('  다만 새 파일에 그동안 못 본 조항이 있을 수 있으니 "없음" 판정 근거를 다시 확인하세요.')
  console.log('  확인을 마쳤으면 node scripts/agreement-files.mjs save "YYYY-MM-DD" 로 지문을 갱신합니다.')
} else {
  console.log('\n바뀐 파일이 대상 협정 24개와 무관합니다 — 수록 조항에 영향 없음.')
  console.log('  확인을 마쳤으면 node scripts/agreement-files.mjs save "YYYY-MM-DD" 로 지문을 갱신합니다.')
}
