// 협정 추가 패널 (2차 사이클 신규) — 협정이 24개로 늘어 한 줄 나열이 불가능해지면서 분리한 UI.
// 규칙(DESIGN.md 1번 ②):
//  - 협정 이름을 부분 일치로 검색한다 (예: "베트" → 한-베트남)
//  - "조항 있는 협정만 보기"는 기본 켜짐 — 실무에서 먼저 알고 싶은 것이 "조항 있는 협정"이므로
//  - 목록 각 항목에 현재 주제 기준 있음/없음을 함께 보여 고르면서 바로 판단하게 한다
//  - 최대 4개가 차면 미선택 항목은 추가할 수 없다
//  - 검색 결과 0건은 이 패널 안에만 표시한다 (비교 뷰를 대체하지 않음)
import { useState, useEffect, useRef } from 'react'
import { MAX_SELECTION } from '../constants.js'

// props:
//  - availability: [{ agreement, available }] — 현재 주제 기준 협정별 조항 유무 (App에서 계산)
//  - selectedAgreements: 현재 선택된 협정 배열(순서 유지)
//  - onToggle(agreement): 항목을 눌렀을 때 선택/해제
//
// 패널 닫기(바깥 클릭·Esc)는 위젯 전체를 감싸는 AgreementSelector가 담당한다.
// 여기서 패널만 감시하면 "＋ 협정 추가" 버튼 클릭이 바깥 클릭으로 잡혀 곧바로 닫히기 때문이다.
export default function AgreementPicker({ availability, selectedAgreements, onToggle }) {
  const [query, setQuery] = useState('')
  // 기본 켜짐 (DESIGN.md: 조항 있는 협정부터 보는 것이 실무 흐름에 맞음)
  const [onlyAvailable, setOnlyAvailable] = useState(true)

  const searchRef = useRef(null)

  // 패널이 열리면 검색창에 바로 입력할 수 있게 포커스를 준다.
  useEffect(() => {
    searchRef.current?.focus()
  }, [])

  const isFull = selectedAgreements.length >= MAX_SELECTION
  const trimmed = query.trim()

  // 목록 = 이름 검색 ∩ (있음만 보기 필터)
  // 단, 이미 선택한 협정은 필터와 무관하게 남겨 해제할 수 있게 한다.
  const visible = availability.filter(({ agreement, available }) => {
    const selected = selectedAgreements.includes(agreement)
    if (trimmed && !agreement.includes(trimmed)) return false
    if (onlyAvailable && !available && !selected) return false
    return true
  })

  // 필터를 끄면 찾을 수 있는 것이 있는지 — 0건 안내를 정확히 하기 위해 확인한다.
  const hiddenByFilter =
    visible.length === 0 &&
    onlyAvailable &&
    availability.some(({ agreement }) => !trimmed || agreement.includes(trimmed))

  return (
    <div className="agreement-picker" role="dialog" aria-label="협정 추가">
      <div className="picker-controls">
        <label className="picker-search">
          <span className="picker-search-icon" aria-hidden="true">🔎</span>
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="협정 이름 검색 (예: 베트)"
            aria-label="협정 이름 검색"
          />
        </label>
        <label className="picker-filter">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(e) => setOnlyAvailable(e.target.checked)}
          />
          조항 있는 협정만 보기
        </label>
      </div>

      {isFull && (
        <p className="picker-note">
          최대 {MAX_SELECTION}개까지 비교할 수 있습니다. 다른 협정을 고르려면 먼저 하나를 해제하세요.
        </p>
      )}

      <ul className="picker-list">
        {visible.map(({ agreement, available }) => {
          const selected = selectedAgreements.includes(agreement)
          // 아직 안 골랐는데 이미 4개가 찼으면 추가 불가
          const disabled = !selected && isFull
          return (
            <li key={agreement}>
              <button
                type="button"
                className={
                  'picker-item' +
                  (selected ? ' is-selected' : '') +
                  (disabled ? ' is-disabled' : '')
                }
                disabled={disabled}
                aria-pressed={selected}
                onClick={() => onToggle(agreement)}
              >
                <span className="picker-item-name">{agreement}</span>
                <span
                  className={
                    'picker-item-state' + (available ? ' is-available' : ' is-unavailable')
                  }
                >
                  {available ? '있음' : '없음'}
                </span>
                <span className="picker-item-action" aria-hidden="true">
                  {selected ? '✓' : disabled ? '' : '＋'}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {visible.length === 0 && (
        // 협정 이름 검색 0건 — 이 패널 안에만 표시하고 비교 뷰는 건드리지 않는다.
        // 필터 때문에 안 보이는 경우에는 그 사실까지 알려준다.
        <p className="picker-empty">
          일치하는 협정이 없습니다.
          {hiddenByFilter && (
            <>
              <br />
              <span className="picker-empty-hint">
                “조항 있는 협정만 보기”가 켜져 있습니다. 끄면 더 찾을 수 있습니다.
              </span>
            </>
          )}
        </p>
      )}
    </div>
  )
}
