// 협정별 조항 유무 자동 찾기 (개발 단위 5, 기능 3) —
// 선택한 주제에 대해 대상 협정 각각이 그 조항을 가졌는지(있음/없음)를 자동 표시한다.
// 판정 기준: 데이터의 topic 태그. 조항이 하나라도 있으면 "있음", 없으면 "없음".
// 조항 유무를 임의로 추론하지 않는다 (CLAUDE.md 규칙). (DESIGN.md 4번: AvailabilityBar / 흐름 2)
import { AGREEMENTS } from '../constants.js'

// props:
//  - selectedTopic: 현재 선택된 주제 key
//  - articles: 전체 조항 데이터
export default function AvailabilityBar({ selectedTopic, articles }) {
  // 협정별 조항 유무를 topic 태그로 판정 (데이터에 있는 그대로만)
  const availability = AGREEMENTS.map((agreement) => ({
    agreement,
    available: articles.some(
      (a) => a.agreement === agreement && a.topic === selectedTopic
    ),
  }))

  return (
    <section className="availability-bar">
      <span className="control-label">협정별 조항 유무</span>
      <div className="availability-badges">
        {availability.map(({ agreement, available }) => (
          <span
            key={agreement}
            className={
              'availability-badge' + (available ? ' is-available' : ' is-unavailable')
            }
          >
            {agreement} {available ? '✅ 있음' : '❌ 없음'}
          </span>
        ))}
      </div>
    </section>
  )
}
