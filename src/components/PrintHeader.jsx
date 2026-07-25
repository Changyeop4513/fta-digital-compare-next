// 인쇄물 머리글 (2차 사이클 이후 신규) — 화면에는 보이지 않고 인쇄·PDF 저장에서만 나온다.
// 왜 필요한가: 종이로 뽑으면 화면의 컨트롤 바(주제·협정·검색어)가 사라져서
// "무엇을 기준으로 뽑은 표인지"를 알 수 없다. 회의·보고에 돌려 쓰이는 문서이므로
// 조건을 문서 안에 남겨 둔다. (원문은 손대지 않고 조건만 적는다)
import { AGREEMENT_FULL_NAMES } from '../constants.js'

// props:
//  - topicLabel: 현재 주제의 화면 표기 (예: 'Customs Duties(관세)')
//  - selectedAgreements: 고른 협정(짧은 이름) 배열 — 고른 순서 = 비교 뷰 좌우 순서
//  - keyword: 원문 검색어 (없으면 표시하지 않는다)
//  - printedAt: 출력 시점 문자열 (App에서 인쇄 직전에 만들어 내려준다)
export default function PrintHeader({ topicLabel, selectedAgreements, keyword, printedAt }) {
  // 인쇄물에서는 자리가 넉넉하므로 정식 명칭을 쓴다 (비교 뷰 칸 머리와 같은 기준)
  const fullNames = selectedAgreements.map((a) => AGREEMENT_FULL_NAMES[a] ?? a)

  return (
    <div className="print-header" aria-hidden="true">
      <div className="print-header-title">FTA 디지털협정 조항 비교</div>

      <dl className="print-header-meta">
        <dt>주제</dt>
        <dd>{topicLabel}</dd>

        <dt>비교 협정</dt>
        <dd>
          {fullNames.length > 0 ? `${fullNames.join(' · ')} (${fullNames.length}개)` : '—'}
        </dd>

        {/* 검색어는 있을 때만 — 없는데 "검색어: 없음"을 적으면 오히려 헷갈린다 */}
        {keyword.trim() && (
          <>
            <dt>원문 검색어</dt>
            <dd>“{keyword.trim()}”</dd>
          </>
        )}

        <dt>출력 시점</dt>
        <dd>{printedAt}</dd>
      </dl>

      <p className="print-header-note">
        조항 원문은 정부 공식 협정문에서 그대로 옮긴 것이며 요약·수정하지 않았습니다.
        각 조항의 기준일과 출처는 조항마다 함께 적혀 있습니다.
      </p>
    </div>
  )
}
