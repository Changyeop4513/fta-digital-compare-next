// 전체 앱의 최상위 컴포넌트. 상태(state)를 여기서 관리해 하위 컴포넌트에 내려준다. (DESIGN.md 4번)
// 개발 단위 7(비교 뷰) 단계 — 선택한 협정을 좌우로 나란히 비교 뷰로 보여준다.
import { useState, useEffect } from 'react'
import moefLogo from './assets/moef-logo-header.svg' // 재정경제부 로고 (어두운 헤더용 반전 버전: 흰 원판 제거, 남색 불꽃·글자를 흰색으로)
import TopicSelector, { TOPICS } from './components/TopicSelector.jsx'
import AgreementSelector from './components/AgreementSelector.jsx'
import SearchBar from './components/SearchBar.jsx'
import PrintButton from './components/PrintButton.jsx'
import PrintHeader from './components/PrintHeader.jsx'
import AvailabilityBar from './components/AvailabilityBar.jsx'
import ComparisonView from './components/ComparisonView.jsx'
import EmptyState from './components/EmptyState.jsx'
import articles from './data/articles.json'
import { AGREEMENTS, MAX_SELECTION } from './constants.js'

export default function App() {
  // 현재 고른 주제 1개. 한 번에 1개만. 기본값은 첫 번째 주제. (DESIGN.md 상태: selectedTopic)
  const [selectedTopic, setSelectedTopic] = useState(TOPICS[0].key)

  // 선택된 협정 목록(선택 순서 유지, 최대 4개). selectedTopic 과 별개 상태라
  // 주제를 바꿔도 이 선택은 유지된다. (DESIGN.md 상태: selectedAgreements)
  const [selectedAgreements, setSelectedAgreements] = useState([])

  // 검색어. 비교 뷰에 보이는 원문(선택 주제·협정 범위) 안에서만 하이라이트한다. (DESIGN.md 상태: keyword)
  const [keyword, setKeyword] = useState('')

  // 인쇄물 머리글에 적을 출력 시점. 인쇄를 누른 순간의 값을 기록한다.
  const [printedAt, setPrintedAt] = useState('')
  // 인쇄 요청 횟수. 값이 바뀔 때만 window.print()를 부르는 방아쇠로 쓴다.
  const [printRequest, setPrintRequest] = useState(0)

  // 검색 0건 판정 (개발 단위 11, 예외): 검색어가 있는데 선택 범위(주제+협정)의 원문 어디에도
  // 없으면 "검색 결과가 없습니다"를 안내한다. 검색은 전체가 아니라 선택 범위 안에서만 한다.
  // [공백 처리 정책] 검색어 앞뒤 공백은 무시(trim)하고, 단어 사이 공백은 그대로 매칭에 사용한다.
  //   (예: "  무관세  " → "무관세"로 검색 / "전자적 전송"은 사이 공백까지 포함해 부분일치)
  //   이 정책은 하이라이트(ArticleCard.highlightText·hasMatch)에서도 동일하게 .trim()으로 일관 적용된다.
  // 협정별 조항 유무 판정 (기능 3). 판정 기준은 데이터의 topic 태그뿐이며 임의 추론하지 않는다.
  // 협정 선택 패널과 유무 바가 같은 값을 쓰도록 여기서 한 번만 계산해 내려준다.
  const availability = AGREEMENTS.map((agreement) => ({
    agreement,
    available: articles.some(
      (a) => a.agreement === agreement && a.topic === selectedTopic
    ),
  }))

  // 현재 주제의 화면 표시명 (유무 바 요약 문구에 쓴다)
  const topicLabel = TOPICS.find((t) => t.key === selectedTopic)?.label ?? ''

  // 협정 선택/해제 — 칩·추가 패널·유무 배지가 모두 이 하나를 쓴다.
  // 선택 순서를 유지하고(비교 뷰 좌우 순서), 최대 개수를 넘으면 무시한다.
  function toggleAgreement(agreement) {
    setSelectedAgreements((prev) =>
      prev.includes(agreement)
        ? prev.filter((a) => a !== agreement)
        : prev.length >= MAX_SELECTION
          ? prev
          : [...prev, agreement]
    )
  }

  const trimmedKeyword = keyword.trim()
  const scopedArticles = articles.filter(
    (a) => a.topic === selectedTopic && selectedAgreements.includes(a.agreement)
  )
  const noSearchResult =
    trimmedKeyword.length > 0 &&
    !scopedArticles.some((a) => {
      const kw = trimmedKeyword.toLowerCase()
      return (
        (a.text_en && a.text_en.toLowerCase().includes(kw)) ||
        (a.text_ko && a.text_ko.toLowerCase().includes(kw))
      )
    })

  // 인쇄할 내용이 있는가 — 비교 뷰가 안 나오는 두 경우(협정 0개 · 검색 0건)에는 버튼을 잠근다.
  // 빈 종이가 나오는 것보다 버튼이 잠기는 편이 낫다.
  const nothingToPrint = selectedAgreements.length === 0 || noSearchResult

  // 인쇄 실행 — 출력 시점을 먼저 상태에 넣고, 그 값이 화면에 반영된 뒤에 인쇄 창을 띄운다.
  // (setState 직후 바로 window.print()를 부르면 머리글의 출력 시점이 비어 있는 채로 인쇄된다)
  function handlePrint() {
    const d = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    setPrintedAt(
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
        `${pad(d.getHours())}:${pad(d.getMinutes())}`
    )
    setPrintRequest((n) => n + 1)
  }

  useEffect(() => {
    if (printRequest === 0) return // 첫 렌더에서는 인쇄하지 않는다
    window.print()
  }, [printRequest])

  return (
    <div className="app">
      {/* ① 헤더 — 로고 + (제목 + 부제) */}
      <header className="app-header">
        {/* 로고를 좌측에 두고, 제목·부제를 오른쪽 열에 세로로 쌓아 상하 가운데 정렬 */}
        <div className="app-header-inner app-title-row">
          <img className="app-logo" src={moefLogo} alt="재정경제부 로고" />
          <div className="app-header-text">
            {/* 제목을 누르면 첫 화면으로 새로고침한다 (고른 주제·협정·검색어가 모두 초기화된다).
                버튼이 아니라 링크로 둔 이유: 키보드 이동·스크린리더 안내가 기본으로 되고,
                새 탭으로 열기 같은 브라우저 기본 동작도 그대로 쓸 수 있다.
                주소는 BASE_URL 을 쓴다 — 배포 경로가 바뀌어도 따라간다. */}
            <h1>
              <a
                className="app-title-link"
                href={import.meta.env.BASE_URL}
                title="처음 화면으로 새로고침"
              >
                FTA 디지털협정 조항 비교 서비스
              </a>
            </h1>
            <p className="app-subtitle">
              재정경제부 소관 디지털 통상 3개 주제(전자적 전송물 무관세 · 특송화물 · 종이 없는 무역)를 협정별로 나란히 비교합니다.
            </p>
          </div>
        </div>
      </header>

      <main className="app-main">
        {/* ② 컨트롤 바 — 주제 선택 + 협정 선택. 이후 검색이 추가된다. */}
        <section className="control-bar">
          <TopicSelector selectedTopic={selectedTopic} onSelect={setSelectedTopic} />
          <AgreementSelector
            availability={availability}
            selectedAgreements={selectedAgreements}
            onToggle={toggleAgreement}
          />
          <SearchBar keyword={keyword} onChange={setKeyword} />
          {/* ⑤ 내보내기 — 현재 비교 결과를 인쇄하거나 PDF로 저장 */}
          <PrintButton disabled={nothingToPrint} onPrint={handlePrint} />
        </section>

        {/* 인쇄물 머리글 — 화면에서는 숨겨져 있고 인쇄에서만 나온다.
            종이에는 컨트롤 바가 안 나오므로 "어떤 조건으로 뽑은 표인지"를 여기 남긴다. */}
        <PrintHeader
          topicLabel={topicLabel}
          selectedAgreements={selectedAgreements}
          keyword={keyword}
          printedAt={printedAt}
        />

        {/* ③ 협정별 조항 유무 바 — 선택 주제에 대해 협정별 있음/없음 자동 표시 (기능 3).
            배지를 눌러 바로 비교 대상에 넣을 수 있다 (기능 3 → 기능 1 연결). */}
        <AvailabilityBar
          topicLabel={topicLabel}
          availability={availability}
          selectedAgreements={selectedAgreements}
          onToggle={toggleAgreement}
        />

        {/* ④ 비교 뷰 — 선택 협정을 좌우로 나란히 (기능 1).
            협정 0개면 안내 (예외 처리 완성은 개발 단위 11에서 다듬음). */}
        {selectedAgreements.length === 0 ? (
          // 협정 0개 선택 → 비교 뷰를 띄우지 않고 화면 전체 안내
          <EmptyState message="비교할 협정을 선택하세요." />
        ) : noSearchResult ? (
          // 검색 0건 → 비교 뷰 대신 화면 전체 안내로 대체 (DESIGN: 검색 0건은 "화면 전체 안내")
          <EmptyState message={`검색 결과가 없습니다. (검색어: “${trimmedKeyword}”)`} />
        ) : (
          <ComparisonView
            selectedAgreements={selectedAgreements}
            selectedTopic={selectedTopic}
            articles={articles}
            keyword={keyword}
          />
        )}
      </main>
    </div>
  )
}
