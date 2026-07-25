// 협정 선택 UI — 고른 협정을 칩으로 보여주고 해제할 수 있게 한다.
// 규칙(DESIGN.md 1번 ②):
//  - 고른 협정만 칩으로 컨트롤 바에 항상 노출한다 (최대 4개라 한 줄에 들어간다)
//  - 칩의 좌→우 순서가 비교 뷰의 좌우 순서다 (선택 순서 유지)
//  - 주제를 바꿔도 이 선택은 유지된다 (App이 selectedTopic 과 별개 상태로 관리)
//
// ※ 협정을 '추가'하는 입구는 아래 「협정별 조항 유무」 배지다 (기능 3 → 기능 1 직결).
//   이전에 있던 "＋ 협정 추가" 패널은 사용자 요청으로 제거했고,
//   쓰이지 않게 된 AgreementPicker 는 trash-can 폴더로 옮겨 두었다.
import { MAX_SELECTION } from '../constants.js'

// props:
//  - selectedAgreements: 현재 선택된 협정 배열(선택 순서 유지)
//  - onToggle(agreement): 선택/해제. 구현은 App 한 곳에만 두어 칩과 유무 배지가 같은 것을 쓴다.
export default function AgreementSelector({ selectedAgreements, onToggle }) {
  return (
    <div className="agreement-selector">
      <span className="control-label">
        협정 선택 <span className="control-hint">(최대 {MAX_SELECTION}개)</span>
      </span>

      <div className="agreement-chips">
        {selectedAgreements.length === 0 ? (
          // 아무것도 고르지 않은 상태 — 어디서 고르는지 알려준다
          <span className="agreement-chips-empty">
            아래 「협정별 조항 유무」에서 협정을 눌러 추가하세요
          </span>
        ) : (
          selectedAgreements.map((agreement) => (
            <span key={agreement} className="agreement-chip">
              {agreement}
              <button
                type="button"
                className="agreement-chip-remove"
                onClick={() => onToggle(agreement)}
                aria-label={`${agreement} 선택 해제`}
              >
                ✕
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  )
}
