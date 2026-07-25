// 협정 선택 UI — 2차 사이클 개편 (협정 24개 대응).
// 규칙(DESIGN.md 1번 ②):
//  - 고른 협정만 칩으로 컨트롤 바에 항상 노출한다 (최대 4개라 한 줄에 들어간다)
//  - 고르는 행위는 "＋ 협정 추가" 패널로 분리한다 (24개를 한 줄에 나열하지 않는다)
//  - 칩의 좌→우 순서가 비교 뷰의 좌우 순서다 (선택 순서 유지)
//  - 최대 4개가 차면 추가 버튼을 막는다
//  - 주제를 바꿔도 이 선택은 유지된다 (App이 selectedTopic 과 별개 상태로 관리)
import { useState, useEffect, useRef } from 'react'
import { MAX_SELECTION } from '../constants.js'
import AgreementPicker from './AgreementPicker.jsx'

// props:
//  - availability: [{ agreement, available }] — 현재 주제 기준 협정별 조항 유무 (App에서 계산)
//  - selectedAgreements: 현재 선택된 협정 배열(선택 순서 유지)
//  - onToggle(agreement): 선택/해제. 구현은 App 한 곳에만 두어 칩·패널·유무 배지가 같은 것을 쓴다.
//    (직접 배열을 만들어 넘기면 한 번에 여러 번 눌렸을 때 앞선 선택이 덮어써진다 — App은 함수형 갱신을 쓴다)
export default function AgreementSelector({ availability, selectedAgreements, onToggle }) {
  const [pickerOpen, setPickerOpen] = useState(false)
  // 위젯 전체(라벨·칩·버튼·패널)를 감싸는 영역. 바깥 클릭 판정 기준이 된다.
  const wrapperRef = useRef(null)

  // 패널이 열려 있을 때만 바깥 클릭·Esc 를 감시한다.
  useEffect(() => {
    if (!pickerOpen) return
    function onDocClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setPickerOpen(false)
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') setPickerOpen(false)
    }
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [pickerOpen])

  const isFull = selectedAgreements.length >= MAX_SELECTION

  return (
    <div className="agreement-selector" ref={wrapperRef}>
      <span className="control-label">
        협정 선택 <span className="control-hint">(최대 {MAX_SELECTION}개)</span>
      </span>

      <div className="agreement-chips">
        {selectedAgreements.length === 0 ? (
          <span className="agreement-chips-empty">아직 고른 협정이 없습니다</span>
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

        <button
          type="button"
          className={'agreement-add' + (pickerOpen ? ' is-open' : '')}
          onClick={() => setPickerOpen((v) => !v)}
          disabled={isFull && !pickerOpen}
          aria-expanded={pickerOpen}
          title={isFull ? `최대 ${MAX_SELECTION}개까지 선택할 수 있습니다` : '협정 추가'}
        >
          ＋ 협정 추가
        </button>
      </div>

      {pickerOpen && (
        <AgreementPicker
          availability={availability}
          selectedAgreements={selectedAgreements}
          onToggle={onToggle}
        />
      )}
    </div>
  )
}
