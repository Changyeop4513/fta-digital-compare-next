// 비교 뷰의 협정 1개 칸 (개발 단위 7, 기능 1).
// 이 협정이 선택 주제에 대해 가진 조항들을 ArticleCard 로 세로로 나열한다.
import ArticleCard from './ArticleCard.jsx'
import { AGREEMENT_FULL_NAMES } from '../constants.js'

export default function AgreementColumn({ agreement, articles, keyword }) {
  // 비교 뷰는 칸 폭이 넓으므로 협정 정식 명칭을 쓴다 (배지·칩은 짧은 이름 유지).
  // 매핑에 없으면 짧은 이름을 그대로 써서 빈 제목이 나오지 않게 한다.
  const fullName = AGREEMENT_FULL_NAMES[agreement] ?? agreement

  return (
    <div className="agreement-column">
      {/* 칸 머리 — 협정 정식 명칭 */}
      <div className="agreement-column-header">{fullName}</div>

      <div className="agreement-column-body">
        {articles.length === 0 ? (
          // 이 협정이 선택 주제 조항을 아예 안 가진 경우 — 칸 안에 명시 ("번역 없음"과 구분, DESIGN M1)
          <p className="no-article">해당 조항 없음</p>
        ) : (
          articles.map((article, index) => (
            <ArticleCard key={index} article={article} keyword={keyword} />
          ))
        )}
      </div>
    </div>
  )
}
