// 조항 1건 카드 (개발 단위 8~9, 기능 1) — 영문 원문 + 한국어본을 한 쌍으로 표시한다.
// 한국어본이 비어 있으면 "번역 없음"으로 명시한다. (CLAUDE.md 규칙)
// 원문(text_en/text_ko)은 절대 요약·수정하지 않고 준비된 그대로 표시만 한다.
// 원문이 길면 기본은 앞 몇 줄만 접어서 보여주고 "더보기"로 전체를 펼친다. (개발 단위 9)
import { useState } from 'react'

// 이 글자 수를 넘으면 "더보기"로 접는다.
const LONG_TEXT_THRESHOLD = 120

// 원문(text) 안에서 keyword 를 찾아 <mark>로 감싼 React 노드 배열을 만든다.
// - 부분 일치, 영문은 대소문자 무시(양쪽을 소문자로 바꿔 비교)
// - 원문 자체는 손대지 않고(요약·수정 없음) 표시만 감싼다. 출력은 원문 대소문자 그대로.
function highlightText(text, keyword) {
  const kw = keyword && keyword.trim()
  if (!kw) return text

  const parts = []
  const lowerText = text.toLowerCase()
  const lowerKw = kw.toLowerCase()
  let start = 0
  let markKey = 0
  let idx = lowerText.indexOf(lowerKw, start)

  while (idx !== -1) {
    if (idx > start) parts.push(text.slice(start, idx)) // 일치 앞의 일반 텍스트
    parts.push(
      <mark key={markKey++} className="highlight">
        {text.slice(idx, idx + kw.length)}
      </mark>
    )
    start = idx + kw.length
    idx = lowerText.indexOf(lowerKw, start)
  }
  if (start < text.length) parts.push(text.slice(start)) // 마지막 남은 텍스트
  return parts
}

export default function ArticleCard({ article, keyword }) {
  const [expanded, setExpanded] = useState(false)
  const hasKo = article.text_ko && article.text_ko.trim()

  // 영문 또는 한국어본이 길면 접기 대상으로 본다.
  const isLong =
    (article.text_en && article.text_en.length > LONG_TEXT_THRESHOLD) ||
    (hasKo && article.text_ko.length > LONG_TEXT_THRESHOLD)

  // 이 조항의 원문(영/한)에 검색어가 포함되는가? (부분 일치, 영문 대소문자 무시)
  // 검색어가 접힌 부분에 있으면 하이라이트가 안 보이므로, 포함 시 자동으로 펼친다.
  const kw = keyword && keyword.trim().toLowerCase()
  const hasMatch =
    !!kw &&
    ((article.text_en && article.text_en.toLowerCase().includes(kw)) ||
      (hasKo && article.text_ko.toLowerCase().includes(kw)))

  // 실제로 전체를 펼쳐 보일지: 사용자가 더보기를 눌렀거나, 검색어가 이 조항에 있으면 펼친다.
  const showFull = expanded || hasMatch

  // 접힌 상태(길고 & 안 펼침)면 텍스트를 앞 몇 줄만 보이도록 clamp 한다.
  const textClass = 'article-lang-text' + (isLong && !showFull ? ' is-clamped' : '')

  return (
    <div className="article-card">
      <div className="article-card-no">{article.article_no}</div>

      {/* 데이터 기준 시점 라벨 (개발 단위 10). 개정 자동 추적이 아니라 "언제 기준본인지" 표시용. */}
      <div className="article-card-baseline">기준일: {article.baseline_date}</div>

      {/* 영문 원문 (검색어가 있으면 하이라이트) */}
      <div className="article-lang">
        <span className="article-lang-label">EN</span>
        <p className={textClass}>{highlightText(article.text_en, keyword)}</p>
      </div>

      {/* 한국어본 — 없으면 "번역 없음" (있으면 하이라이트) */}
      <div className="article-lang">
        <span className="article-lang-label">KO</span>
        {hasKo ? (
          <p className={textClass}>{highlightText(article.text_ko, keyword)}</p>
        ) : (
          <p className="article-lang-text is-missing">번역 없음</p>
        )}
      </div>

      {/* 원문이 길 때만 더보기/접기 버튼 표시.
          단, 검색어로 자동 펼쳐진 상태(hasMatch)에서는 버튼을 숨긴다
          — 접으면 검색 하이라이트가 다시 가려지기 때문. */}
      {isLong && !hasMatch && (
        <button
          type="button"
          className="more-button"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? '접기' : '더보기'}
        </button>
      )}

      {/* 출처 — 화면에서는 접이식 토글로 제공한다 〔7차〕.
          화면은 원문 비교에 집중시키되(기본 접힘), 출처·검증 경위가 필요할 때 그 자리에서
          펼쳐 볼 수 있게 한다. 네이티브 <details>라 상태 관리가 필요 없다. */}
      {article.source && (
        <details className="article-source-toggle">
          <summary>출처</summary>
          <p className="article-source-text">{article.source}</p>
        </details>
      )}

      {/* 출처(인쇄용) — 인쇄·PDF에서는 토글 없이 전문이 항상 나온다(CSS의 @media print).
          <details>는 접힌 채 인쇄되면 내용이 잘리므로 인쇄용 요소를 따로 둔다. */}
      {article.source && (
        <div className="article-card-source">출처: {article.source}</div>
      )}
    </div>
  )
}
