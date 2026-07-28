// 주제 선택 UI (개발 단위 4) — 고정된 주제 중 하나만 고른다.
// (DESIGN.md 4번: 라디오로 단일 선택 / CLAUDE.md 규칙: 주제는 이 목록으로 고정, 임의 추가·변경 금지)
// DESIGN 정합: 네이티브 라디오(<input type="radio">)로 라디오 의미와 접근성(키보드 화살표 이동,
// 스크린리더 "라디오 1/5 선택됨")을 확보하고, 라벨은 알약(pill) 버튼 모양으로 스타일링해 기존 외형을 유지한다.

// 고정 주제 목록. key = 데이터의 topic 값(협정 간 조항을 묶는 매칭 기준), label = 화면 표시용 이름.
// 순서는 협정문에서 다루는 흐름을 따른다 — 관세·디지털제품 → 통관 절차(특송) → 무역서류(종이없음·전자송장) → 결제(전자지급).
// 〔3차 추가〕 전자송장·전자지급. 근거·선정 경위는 PRD 5절 참조.
export const TOPICS = [
  { key: 'customs_duties', label: 'Customs Duties(관세)' },
  { key: 'express_shipments', label: 'Express shipments(특송화물)' },
  { key: 'paperless_trading', label: 'Paperless trading(종이 없는 무역)' },
  { key: 'e_invoicing', label: 'E-invoicing(전자송장)' },
  { key: 'electronic_payment', label: 'Electronic payments(전자지급)' },
  { key: 'government_procurement', label: 'Government procurement(정부조달)' },
  { key: 'taxation_exception', label: 'Taxation exception(과세 예외)' },
]

// 〔4차 추가 시 범위 유의〕
//  - government_procurement 은 **디지털 경제와 관련된 정부조달 조항만** 담는다(사용자 결정).
//    전통 FTA의 정부조달 '장' 전체를 담으면 한 칸에 조문이 수십 개가 되어 좌우 비교가 무의미해진다.
//  - taxation_exception 은 협정 전체에 걸리는 **일반 예외** 조항이라 디지털 통상 조항은 아니지만,
//    재정경제부 소관이라 실무 가치가 커서 24개 협정 전부를 대상으로 수록한다(사용자 결정).

// props:
//  - selectedTopic: 현재 선택된 주제 key
//  - onSelect(topicKey): 주제를 고르면 상위(App)에 알린다
export default function TopicSelector({ selectedTopic, onSelect }) {
  return (
    <div className="topic-selector">
      <span className="control-label" id="topic-selector-label">주제 선택</span>
      {/* 네이티브 라디오 그룹 — name 공유로 단일 선택이 보장된다. */}
      <div className="topic-radios" role="radiogroup" aria-labelledby="topic-selector-label">
        {TOPICS.map((topic) => (
          <label
            key={topic.key}
            className={'topic-radio' + (selectedTopic === topic.key ? ' is-selected' : '')}
          >
            <input
              type="radio"
              name="topic"
              value={topic.key}
              className="topic-radio-input"
              checked={selectedTopic === topic.key}
              onChange={() => onSelect(topic.key)}
            />
            {topic.label}
          </label>
        ))}
      </div>
    </div>
  )
}
