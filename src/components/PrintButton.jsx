// 「인쇄 / PDF 저장」 버튼 — 브라우저 인쇄 창을 띄운다.
// 별도 PDF 라이브러리를 쓰지 않는 이유: 이 앱은 외부 통신 없는 정적 앱이고 CSP가 'self'로 묶여 있다.
// 브라우저 인쇄를 쓰면 한글 폰트를 따로 내장할 필요가 없어 원문이 깨질 위험도 없다.
// 실제 종이 인쇄와 "PDF로 저장"이 같은 경로라 버튼 하나로 둘 다 된다.

// props:
//  - disabled: 인쇄할 내용이 없을 때(협정 0개 · 검색 0건) true
//  - onPrint(): 인쇄 실행 (출력 시점 기록 후 window.print())
export default function PrintButton({ disabled, onPrint }) {
  return (
    <div className="print-action">
      <button
        type="button"
        className="print-button"
        onClick={onPrint}
        disabled={disabled}
        title={
          disabled
            ? '인쇄할 비교 결과가 없습니다'
            : '현재 비교 화면을 A4 가로로 인쇄하거나 PDF로 저장합니다'
        }
      >
        🖨 인쇄 / PDF 저장
      </button>
    </div>
  )
}
