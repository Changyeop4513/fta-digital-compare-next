// Vite 설정 — React(JSX) 플러그인을 활성화한다.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 보안 응답 헤더 (CHECK.md 남은 조치 1번: 보안 응답 헤더 + HTTPS 강제)
// 로컬 실행 기준(CLAUDE.md)이라 dev/preview 서버 응답에 헤더를 실어, 배포 전에도 로컬에서 검증 가능하게 한다.
// 아래 4개는 인라인 스크립트를 막지 않아 개발 서버의 HMR을 깨뜨리지 않으므로 dev·preview 양쪽에 적용한다.
const baseSecurityHeaders = {
  // MIME 스니핑 차단
  'X-Content-Type-Options': 'nosniff',
  // 클릭재킹 방지(같은 출처만 iframe 허용)
  'X-Frame-Options': 'SAMEORIGIN',
  // Referrer 최소 노출
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // HTTPS 강제(HSTS). 로컬 http/localhost에서는 브라우저가 무시하고, HTTPS 배포 시 활성화된다.
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
}

// CSP는 인라인/웹소켓(ws)/eval을 쓰는 개발 서버 HMR을 깨뜨릴 수 있어, 빌드 결과에만 적용되는 preview에만 엄격 적용한다.
const previewCsp = [
  "default-src 'self'",
  "img-src 'self' data:", // 로고 SVG 등 정적 자산 + data: URI
  "style-src 'self' 'unsafe-inline'", // 빌드 산출물의 인라인 스타일 허용
  "script-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
].join('; ')

export default defineConfig({
  plugins: [react()],
  // 개발 서버(npm run dev) 응답 헤더 — HMR을 위해 CSP는 제외한 안전 헤더만.
  server: { headers: baseSecurityHeaders },
  // 빌드 미리보기(npm run preview) 응답 헤더 — 안전 헤더 + 엄격 CSP.
  preview: {
    headers: {
      ...baseSecurityHeaders,
      'Content-Security-Policy': previewCsp,
    },
  },
})
