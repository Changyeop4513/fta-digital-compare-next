// 키워드 검색창 (개발 단위 10, 기능 2).
// 선택한 주제·협정 범위(비교 뷰에 보이는 원문) 안에서 단어를 찾아 하이라이트한다.
// 부분 일치로 찾고, 영문은 대소문자를 구분하지 않는다. 요약·해석은 하지 않고 하이라이트만 한다.
//
// 〔11차〕 화면 위치가 컨트롤 바 → **헤더 오른쪽**으로 바뀌었다(사용자 제안, 관세법령정보포털 방식).
// 어두운 헤더 위에 놓이므로 라벨은 밝은 색이고, 입력창은 흰 배경 그대로 둔다.
// 라벨은 <label>로 감싸 입력창과 묶는다 — 헤더에서는 라벨과 입력창이 한 줄이라
// for/id 연결 없이도 클릭·스크린리더 안내가 올바르게 동작한다.
export default function SearchBar({ keyword, onChange }) {
  return (
    <label className="search-bar">
      <span className="control-label">원문 검색</span>
      <input
        type="search"
        className="search-input"
        placeholder="원문에서 단어 찾기 (예: 관세, Customs Duties)"
        value={keyword}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}
