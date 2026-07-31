# 원문 검증 도구 모음 (`scripts/verify/`)

수록 조문이 협정문 PDF 원본과 글자·문장부호까지 일치하는지 **기계로** 확인하는 도구들이다.
2026-07-29 전수 재검증(72건 × 영·한 = 144칸)에 실제로 사용한 것을 정리했다.
경위와 판정 기록은 [CHECK.md](../../CHECK.md) v4.1~v4.3, 지켜야 할 규칙은 [CLAUDE.md](../../CLAUDE.md)
「깨진 국문 PDF에서 원문을 복원할 때」에 있다.

## 준비

```bash
npm install   # pdfjs-dist · @napi-rs/canvas (devDependencies)
```

OCR·렌더링은 Windows 내장 기능(WinRT)을 쓰므로 **Windows에서만** 동작한다.
중간 산출물은 `.verify-cache/`에 쌓이며 git에 들어가지 않는다.

## 기본 흐름

```
① 진단        probe-pdf.mjs      → PDF가 어느 유형인지 (정상 / 인코딩 깨짐 / 스캔)
② 전수 감사    audit-articles.mjs → 수록 전건을 텍스트 레이어와 자동 대조
③ 쪽 찾기      find-article.mjs   → 확인이 필요한 조문의 쪽 번호
④ 렌더+분할    render-pages.ps1 → split-lines.mjs
⑤ OCR         ocr-lines.ps1      → 배율 3종(2400·3600·4800px) 각각 판독
⑥ 대조        compare-ocr.mjs    → 다수결 OCR ↔ 수록값 낱말 비교
   (인코딩 깨진 국문은 ⑥ 대신) reconstruct.mjs → 3중 검산 복원
```

새 조문을 **추가**할 때: ①로 PDF 상태를 보고, 정상이면 layout-page.mjs로 추출한 뒤
④~⑥으로 문장부호를 확정해 수록한다. 수록 후 ②를 돌려 자동 감사를 통과하는지 확인한다.

기존 조문을 **재검증**할 때: ②만 돌리면 대부분 끝난다. `일치`가 아닌 칸만 ③~⑥으로 정밀 확인한다.

## 예시

```bash
# 1) PDF 진단
node scripts/verify/probe-pdf.mjs "FTA 협정/16. 한-영국 FTA full_agreement_kr.pdf"

# 2) 전수 감사 (특정 협정만도 가능)
node scripts/verify/audit-articles.mjs
node scripts/verify/audit-articles.mjs 영국,칠레

# 3) 조문 쪽 찾기 (본문 구절로 찾는 것이 제목보다 정확)
node scripts/verify/find-article.mjs "FTA 협정/5. 한-인도 CEPA ALL_OF_CEPA_kor.pdf" find "화물즉시반출지침"

# 4) 렌더 + 글줄 분할  (예: 579쪽 한 쪽)
powershell -File scripts/verify/render-pages.ps1 "FTA 협정/5. 한-인도 CEPA ALL_OF_CEPA_kor.pdf" 579 579 ".verify-cache/in-ex"
node scripts/verify/split-lines.mjs ".verify-cache/in-ex/p0579"

# 5) OCR (배율 3종)
powershell -File scripts/verify/ocr-lines.ps1 ".verify-cache/in-ex/p0579"

# 6) 수록값과 대조
node scripts/verify/compare-ocr.mjs 인도 express_shipments text_ko ".verify-cache/in-ex/p0579"
```

## 판정할 때 알아 둘 것 (전수 재검증에서 실측한 함정들)

- **OCR 오독은 유형이 일정하다** — 줄 끝 쉼표→`/`, 가운뎃점 `·`→`•`, 낱말 중간 공백 삽입,
  영문 o→0·l→1. 이 유형의 차이는 잡음이다. 판단이 서지 않으면 글줄 그림(`lines_w*/L*.png`)을
  열어 활자를 직접 본다.
- **OCR만으로 못 잡는 누락이 있다** — 줄 끝에 홀로 떨어진 한 글자는 배율을 바꿔도 똑같이
  빠진다. 글자 수를 세는 독립 근거(깨진 텍스트 레이어 = reconstruct.mjs)가 있어야 드러난다.
- **레이어가 멀쩡해 보여도 문장부호는 못 믿는다** — 부호를 뒤 낱말 앞으로 밀어 내보내는
  PDF가 있다(한-인도·한-EU). 뷰어에서 복사해도 같은 값이 나오므로 눈 확인도 틀린다.
- **미국 전문 PDF**: 국문은 숫자·부호만, 영문은 전체가 제어문자다. 영문은 포털 장별 PDF로
  대조한다(포털 수집 주소는 CLAUDE.md 참조).
- **한-칠레 국문은 JBIG2 스캔**이라 pdfjs로는 빈 쪽이 나온다. render-pages.ps1(Windows
  렌더러)은 정상으로 그린다.
- **따옴표·아포스트로피 모양은 협정마다 다르다** — 원문 활자가 기준이지 통일이 기준이 아니다.
  (캄보디아는 곧은 `'`, 미국·싱DPA는 둥근 `’`가 원문)
- **rfind(뒤에서 찾기)는 부속서·가입 의정서를 집을 수 있다** — 의심되면 find로 재확인.
- **줄바꿈 자리의 띄어쓰기는 원리적으로 판정 불가** — 협정문 전체의 표기 관행을 세어
  우세한 쪽으로 정하고 `source`에 남긴다(한-인도 "서류 요건" 사례).
