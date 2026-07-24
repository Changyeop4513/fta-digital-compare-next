// 조항별 비교 뷰 (개발 단위 7, 기능 1) — 선택한 협정을 고른 순서대로 좌우로 나란히 칸으로 보여준다.
// 한 화면 최대 4개(selectedAgreements가 이미 4개로 제한됨). 1개면 한 칸만 표시.
// (칸 안 영문/한국어본은 개발 단위 8, 더보기·기준일 라벨은 이후 단계)
import AgreementColumn from './AgreementColumn.jsx'

export default function ComparisonView({ selectedAgreements, selectedTopic, articles, keyword }) {
  return (
    <div className="comparison-view">
      {selectedAgreements.map((agreement) => {
        // 이 협정이 선택 주제에 대해 가진 조항들 — 누락 없이 모두, 조항 번호 순으로 정렬.
        // (숫자를 인식해 정렬: 제14.3조 < 제14.4조 < 제14.10조)
        const columnArticles = articles
          .filter((a) => a.agreement === agreement && a.topic === selectedTopic)
          .sort((a, b) => a.article_no.localeCompare(b.article_no, 'ko', { numeric: true }))
        return (
          <AgreementColumn
            key={agreement}
            agreement={agreement}
            articles={columnArticles}
            keyword={keyword}
          />
        )
      })}
    </div>
  )
}
