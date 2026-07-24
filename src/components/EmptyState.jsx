// 화면 전체 예외 안내 (DESIGN.md: EmptyState) — 비교 뷰를 대체하는 전체 화면 안내.
// 협정 0개 선택 / 검색 0건 같은 "화면 전체 안내" 상황에 쓴다.
// (칸 내부에 표시하는 "해당 조항 없음"·"번역 없음"과는 구분되는, 화면 전체 대체용이다.)
export default function EmptyState({ message }) {
  return <p className="notice empty-state">{message}</p>
}
