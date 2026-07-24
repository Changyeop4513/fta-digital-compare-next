// 키워드 검색창 (개발 단위 10, 기능 2).
// 선택한 주제·협정 범위(비교 뷰에 보이는 원문) 안에서 단어를 찾아 하이라이트한다.
// 부분 일치로 찾고, 영문은 대소문자를 구분하지 않는다. 요약·해석은 하지 않고 하이라이트만 한다.
export default function SearchBar({ keyword, onChange }) {
  return (
    <div className="search-bar">
      <span className="control-label">검색</span>
      <input
        type="search"
        className="search-input"
        placeholder="원문에서 단어 찾기 (예: 관세, Customs Duties)"
        value={keyword}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
