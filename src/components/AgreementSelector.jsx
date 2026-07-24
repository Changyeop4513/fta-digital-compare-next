// 협정 선택 UI (개발 단위 6) — 대상 협정을 체크박스로 고른다.
// 규칙(CLAUDE.md / DESIGN.md):
//  - 한 번에 최대 4개까지만 선택 (초과 금지)
//  - 고른 순서를 유지한다 (비교 뷰 좌우 배치가 이 순서를 따름)
//  - 주제를 바꿔도 이 선택은 유지된다 (App이 selectedTopic 과 별개 상태로 관리)
import { AGREEMENTS } from '../constants.js'

const MAX_SELECTION = 4 // 한 화면 최대 4개 협정 (CLAUDE.md 규칙)

// props:
//  - selectedAgreements: 현재 선택된 협정 배열(선택 순서 유지)
//  - onChange(nextArray): 선택이 바뀌면 상위(App)에 알린다
export default function AgreementSelector({ selectedAgreements, onChange }) {
  const isFull = selectedAgreements.length >= MAX_SELECTION

  function toggle(agreement) {
    if (selectedAgreements.includes(agreement)) {
      // 이미 선택됨 → 해제 (배열에서 제거, 나머지 순서 유지)
      onChange(selectedAgreements.filter((a) => a !== agreement))
    } else {
      // 미선택 → 추가. 단, 최대 개수를 넘으면 무시한다.
      if (isFull) return
      onChange([...selectedAgreements, agreement])
    }
  }

  return (
    <div className="agreement-selector">
      <span className="control-label">
        협정 선택 <span className="control-hint">(최대 {MAX_SELECTION}개)</span>
      </span>
      <div className="agreement-checkboxes">
        {AGREEMENTS.map((agreement) => {
          const checked = selectedAgreements.includes(agreement)
          // 아직 안 골랐는데 이미 4개가 찼으면 더 못 고르게 비활성화
          const disabled = !checked && isFull
          return (
            <label
              key={agreement}
              className={'agreement-checkbox' + (disabled ? ' is-disabled' : '')}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => toggle(agreement)}
              />
              {agreement}
            </label>
          )
        })}
      </div>
    </div>
  )
}
