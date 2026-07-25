// 협정별 조항 유무 자동 찾기 (기능 3) — 2차 사이클 개편 (협정 25개 대응).
// 판정 기준: 데이터의 topic 태그. 조항이 하나라도 있으면 "있음", 없으면 "없음".
// 조항 유무를 임의로 추론하지 않는다 (CLAUDE.md 규칙).
// 규칙(DESIGN.md 1번 ③):
//  - 보유 개수 요약을 함께 보여준다 (예: 「무관세」 — 25개 중 12개 보유)
//  - "있음"만 기본 노출하고 "없음"은 접어 둔다 (숨기는 게 아니라 접는 것 — 없음도 정보다)
//  - 배지를 누르면 바로 비교 대상에 추가/해제된다 (기능 3 → 기능 1 직결)
import { useState } from 'react'
import { MAX_SELECTION } from '../constants.js'

// props:
//  - topicLabel: 현재 주제의 화면 표시명
//  - availability: [{ agreement, available }] — App에서 계산한 협정별 조항 유무
//  - selectedAgreements: 현재 선택된 협정 배열
//  - onToggle(agreement): 배지를 눌렀을 때 선택/해제
export default function AvailabilityBar({
  topicLabel,
  availability,
  selectedAgreements,
  onToggle,
}) {
  const [showUnavailable, setShowUnavailable] = useState(false)

  const availableList = availability.filter((a) => a.available)
  const unavailableList = availability.filter((a) => !a.available)
  const isFull = selectedAgreements.length >= MAX_SELECTION

  // 배지 하나를 그린다. 있음 배지는 눌러서 비교 대상에 넣을 수 있고, 없음 배지는 표시 전용이다.
  function renderBadge({ agreement, available }) {
    const selected = selectedAgreements.includes(agreement)
    const disabled = !available || (!selected && isFull)
    return (
      <button
        key={agreement}
        type="button"
        className={
          'availability-badge' +
          (available ? ' is-available' : ' is-unavailable') +
          (selected ? ' is-selected' : '') +
          (disabled ? ' is-disabled' : '')
        }
        disabled={disabled}
        aria-pressed={available ? selected : undefined}
        onClick={() => available && onToggle(agreement)}
        title={
          !available
            ? '이 협정에는 해당 조항이 없습니다'
            : selected
              ? '비교에서 제외'
              : isFull
                ? `최대 ${MAX_SELECTION}개까지 비교할 수 있습니다`
                : '비교에 추가'
        }
      >
        <span className="availability-badge-name">{agreement}</span>
        <span className="availability-badge-state">
          {available ? (selected ? '✓ 비교 중' : '있음 ＋') : '없음'}
        </span>
      </button>
    )
  }

  return (
    <section className="availability-bar">
      <div className="availability-head">
        <span className="control-label">협정별 조항 유무</span>
        <span className="availability-summary">
          「{topicLabel}」 — {availability.length}개 중{' '}
          <strong>{availableList.length}개</strong> 보유
        </span>
      </div>

      {availableList.length === 0 ? (
        <p className="availability-none">이 주제의 조항을 가진 협정이 아직 없습니다.</p>
      ) : (
        <div className="availability-badges">{availableList.map(renderBadge)}</div>
      )}

      {unavailableList.length > 0 && (
        <div className="availability-unavailable">
          <button
            type="button"
            className="availability-toggle"
            onClick={() => setShowUnavailable((v) => !v)}
            aria-expanded={showUnavailable}
          >
            {showUnavailable ? '▾' : '▸'} 조항 없는 협정 {unavailableList.length}개{' '}
            {showUnavailable ? '접기' : '보기'}
          </button>
          {showUnavailable && (
            <div className="availability-badges is-muted">
              {unavailableList.map(renderBadge)}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
