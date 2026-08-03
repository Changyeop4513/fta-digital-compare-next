import { useEffect, useRef } from 'react'

// 주제 선택 UI (개발 단위 4) — 고정된 주제 중 하나만 고른다.
// (DESIGN.md 4번: 라디오로 단일 선택 / CLAUDE.md 규칙: 주제는 이 목록으로 고정, 임의 추가·변경 금지)
// DESIGN 정합: 네이티브 라디오(<input type="radio">)로 라디오 의미와 접근성(키보드 화살표 이동,
// 스크린리더 "라디오 1/5 선택됨")을 확보하고, 라벨은 알약(pill) 버튼 모양으로 스타일링해 기존 외형을 유지한다.

// 고정 주제 목록. key = 데이터의 topic 값(협정 간 조항을 묶는 매칭 기준), label = 화면 표시용 이름.
// 순서는 협정문에서 다루는 흐름을 따른다 — 관세·비차별(통상 규율) → 통관(특송) → 무역서류(종이없음·전자송장)
// → 거래 기반(인증·지급·핀테크) → 데이터 규율(이전·설비·개인정보·소스코드) → 이용자 보호(소비자·스팸·보안)
// → 조달 → 예외.
// 〔3차 추가〕 전자송장·전자지급 〔4차〕 정부조달·과세 예외 〔6차〕 10개 〔8차〕 13개 — 근거·선정 경위는 PRD 5절.
export const TOPICS = [
  { key: 'customs_duties', label: 'Customs Duties(관세)' },
  { key: 'digital_product_nd', label: 'Non-discrimination(디지털 제품 비차별)' },
  { key: 'express_shipments', label: 'Express shipments(특송화물)' },
  { key: 'paperless_trading', label: 'Paperless trading(종이 없는 무역)' },
  { key: 'e_invoicing', label: 'E-invoicing(전자송장)' },
  { key: 'e_authentication', label: 'E-authentication(전자인증·전자서명)' },
  { key: 'domestic_framework', label: 'Domestic framework(국내 전자거래 체계)' },
  { key: 'e_contracts', label: 'E-contracts(전자 계약)' },
  { key: 'prior_authorisation', label: 'Prior authorisation(사전 승인 금지)' },
  { key: 'electronic_payment', label: 'Electronic payments(전자지급)' },
  { key: 'fintech', label: 'FinTech(핀테크 협력)' },
  { key: 'cross_border_data', label: 'Data flows(국경 간 데이터 이전)' },
  { key: 'computing_facilities', label: 'Computing facilities(컴퓨터 설비 위치)' },
  { key: 'cryptography', label: 'Cryptography(암호 ICT 제품)' },
  { key: 'personal_data', label: 'Personal data(개인정보 보호)' },
  { key: 'source_code', label: 'Source code(소스코드)' },
  { key: 'consumer_protection', label: 'Consumer protection(온라인 소비자 보호)' },
  { key: 'spam', label: 'Spam(스팸 메시지)' },
  { key: 'cybersecurity', label: 'Cybersecurity(사이버보안)' },
  { key: 'online_safety', label: 'Online safety(온라인 안전·보안)' },
  { key: 'internet_access', label: 'Internet access(인터넷 접근·이용)' },
  { key: 'open_gov_data', label: 'Open gov data(정부 데이터 공개)' },
  { key: 'digital_government', label: 'Digital government(디지털 정부)' },
  { key: 'data_innovation', label: 'Data innovation(데이터 혁신)' },
  { key: 'digital_identity', label: 'Digital identity(디지털 신원)' },
  { key: 'ai', label: 'AI(인공지능)' },
  { key: 'competition', label: 'Competition(경쟁정책 협력)' },
  { key: 'sme', label: 'SMEs(중소기업·스타트업)' },
  { key: 'digital_inclusion', label: 'Digital inclusion(디지털 포용)' },
  { key: 'e_logistics', label: 'Logistics(전자상거래 물류)' },
  { key: 'standards', label: 'Standards(표준·적합성평가)' },
  { key: 'government_procurement', label: 'Government procurement(정부조달)' },
  { key: 'taxation_exception', label: 'Taxation exception(과세 예외)' },
]

// 〔범위 유의 — 전부 사용자 결정〕
//  - government_procurement 은 **디지털 경제와 관련된 정부조달 조항만** 담는다.
//    전통 FTA의 정부조달 '장' 전체를 담으면 한 칸에 조문이 수십 개가 되어 좌우 비교가 무의미해진다.
//  - taxation_exception 은 협정 전체에 걸리는 **일반 예외** 조항이라 디지털 통상 조항은 아니지만,
//    재정경제부 소관이라 실무 가치가 커서 전 협정을 대상으로 수록한다.
//  - 〔6차〕 데이터 이전·개인정보·소스코드 등 **타부처 소관 주제까지 확대**했다 — "재경부 소관만"
//    이라는 초기 범위 규칙을 사용자 결정으로 해제하고 디지털 협정 전체를 다룬다(PRD v5.0).
//  - 〔8차〕 13개 추가 — **디지털 무역/전자상거래 장의 독립 조문만** 대상이다.
//    별도 「경쟁 장」(중국·베트남·호주 등 7개 협정)은 competition 대상이 아니다(디지털 장 내 경쟁 조문만).
//  - 〔9차〕 8차에서 미수록으로 남겼던 특수 조문 3개를 **사용자 결정으로 주제화**했다 —
//    e_contracts(EU DTA 제9조) · prior_authorisation(EU DTA 제8조) · digital_government(UAE 9.16 · GCC 9.13).
//    보유 협정이 1~2개뿐이라 대부분 "없음"으로 보이는 것이 정상이다.
//    말레이시아 제12.22조(협력)의 "사. 디지털 정부"는 **협력 대화 주제 목록의 한 항목**이라
//    간접 규정 엄격 판정 기준상 "없음"이다(실질 의무 없음).

// props:
//  - selectedTopic: 현재 선택된 주제 key
//  - onSelect(topicKey): 주제를 고르면 상위(App)에 알린다
export default function TopicSelector({ selectedTopic, onSelect }) {
  // 〔8차〕 주제가 30개라 목록에 스크롤이 생긴다. 선택된 알약이 스크롤 밖에 있으면
  // "지금 무엇을 보는지"가 화면에서 사라지므로, 선택이 바뀔 때마다 그 알약을 보이게 굴린다.
  const selectedRef = useRef(null)
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest' })
  }, [selectedTopic])

  return (
    <div className="topic-selector">
      <span className="control-label" id="topic-selector-label">주제 선택</span>
      {/* 네이티브 라디오 그룹 — name 공유로 단일 선택이 보장된다. */}
      <div className="topic-radios" role="radiogroup" aria-labelledby="topic-selector-label">
        {TOPICS.map((topic) => (
          <label
            key={topic.key}
            ref={selectedTopic === topic.key ? selectedRef : null}
            className={'topic-radio' + (selectedTopic === topic.key ? ' is-selected' : '')}
          >
            <input
              type="radio"
              name="topic"
              value={topic.key}
              className="topic-radio-input"
              checked={selectedTopic === topic.key}
              onChange={() => onSelect(topic.key)}
            />
            {topic.label}
          </label>
        ))}
      </div>
    </div>
  )
}
