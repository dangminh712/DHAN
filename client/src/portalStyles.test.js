import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

test('portal styles include a reusable visually-hidden utility', () => {
  const css = readFileSync(new URL('./styles/portal.css', import.meta.url), 'utf8')
  assert.match(css, /\.sr-only\s*\{[^}]*clip:\s*rect\(0,\s*0,\s*0,\s*0\)/s)
})

test('mobile portal header overrides legacy stacked header rules', () => {
  const css = readFileSync(new URL('./styles/portal.css', import.meta.url), 'utf8')
  assert.match(css, /\.header-container\s*\{[^}]*flex-wrap:\s*nowrap/s)
  assert.match(css, /\.nav-container\s*\{[^}]*flex-wrap:\s*nowrap/s)
  assert.match(css, /@media \(max-width: 768px\)[\s\S]*?\.header-container\s*\{[^}]*flex-direction:\s*row[^}]*flex-wrap:\s*nowrap/s)
  assert.match(css, /@media \(max-width: 768px\)[\s\S]*?\.header-actions\s*\{[^}]*width:\s*auto/s)
  assert.match(css, /@media \(max-width: 768px\)[\s\S]*?\.agency-left,\s*\.agency-right\s*\{[^}]*width:\s*auto/s)
})

test('new portal controls keep a 44px minimum interaction target', () => {
  const portalCss = readFileSync(new URL('./styles/portal.css', import.meta.url), 'utf8')
  const courseCss = readFileSync(new URL('./styles/courses.css', import.meta.url), 'utf8')
  assert.match(portalCss, /\.top-bar-button\s*\{[^}]*min-height:\s*44px/s)
  assert.match(portalCss, /\.footer-nav a\s*\{[^}]*min-height:\s*44px/s)
  assert.match(courseCss, /\.catalog-search button\s*\{[^}]*width:\s*44px[^}]*height:\s*44px/s)
  assert.match(courseCss, /\.course-primary-button,[\s\S]*?min-height:\s*44px/s)
  assert.match(courseCss, /\.course-select select\s*\{[^}]*min-height:\s*44px/s)
  assert.match(courseCss, /\.format-filters button\s*\{[^}]*min-height:\s*44px/s)
})

test('small gold labels use the accessible dark-gold token on light surfaces', () => {
  const courseCss = readFileSync(new URL('./styles/courses.css', import.meta.url), 'utf8')
  assert.doesNotMatch(courseCss, /#c7922c/i)
  assert.match(courseCss, /\.course-kicker,[\s\S]*?color:\s*#7a4e00/s)
})

test('course card primary link exposes the full card as its hit area', () => {
  const courseCss = readFileSync(new URL('./styles/courses.css', import.meta.url), 'utf8')
  assert.match(courseCss, /\.course-card > \.course-primary-button::after\s*\{[^}]*position:\s*absolute[^}]*inset:\s*0/s)
})

test('multi-action groups use calm vertical stacks', () => {
  const portalCss = readFileSync(new URL('./styles/portal.css', import.meta.url), 'utf8')
  const courseCss = readFileSync(new URL('./styles/courses.css', import.meta.url), 'utf8')
  const legacyCss = readFileSync(new URL('./index.css', import.meta.url), 'utf8')

  assert.match(portalCss, /\.home-hero__actions\s*\{[^}]*flex-direction:\s*column[^}]*align-items:\s*stretch/s)
  assert.match(courseCss, /\.material-actions\s*\{[^}]*flex-direction:\s*column[^}]*align-items:\s*stretch/s)
  assert.match(courseCss, /\.material-actions a,\s*\.material-actions button\s*\{[^}]*width:\s*100%/s)
  assert.match(legacyCss, /\.home-segment-selector\s*\{[^}]*flex-direction:\s*column/s)
  assert.match(legacyCss, /\.home-segment-btn \.segment-badge\s*\{[^}]*margin-left:\s*auto/s)
  assert.match(legacyCss, /\.card-actions\s*\{[^}]*flex-direction:\s*column/s)
  assert.match(legacyCss, /\.bieu-mau-card-actions\s*\{[^}]*flex-direction:\s*column[^}]*align-items:\s*stretch/s)
})

test('portal header uses the university logo with a responsive institutional brand lockup', () => {
  const header = readFileSync(new URL('./components/layout/Header.jsx', import.meta.url), 'utf8')
  const css = readFileSync(new URL('./styles/portal.css', import.meta.url), 'utf8')
  const logoUrl = new URL('../public/assets/logo-dhan.jpg', import.meta.url)

  assert.equal(existsSync(logoUrl), true)
  assert.match(header, /<img[^>]+src="\/assets\/logo-dhan\.jpg"[^>]+alt="Logo Trường Đại học An ninh nhân dân"/s)
  assert.match(header, /className="brand-kicker"[^>]*>Bộ Công an · Mã hiệu T04</)
  assert.match(header, /className="brand-portal-name"[^>]*>Cổng môn học và học liệu số</)
  assert.match(css, /\.brand-emblem\s*\{[^}]*border-radius:\s*50%[^}]*overflow:\s*hidden/s)
  assert.match(css, /\.brand-emblem img\s*\{[^}]*object-fit:\s*cover/s)
  assert.match(css, /@media \(max-width: 768px\)[\s\S]*?\.brand-portal-name\s*\{[^}]*display:\s*none/s)
})

test('institutional theme uses restrained police colors instead of decorative rainbow surfaces', () => {
  const portalCss = readFileSync(new URL('./styles/portal.css', import.meta.url), 'utf8')
  const courseCss = readFileSync(new URL('./styles/courses.css', import.meta.url), 'utf8')
  const formCss = readFileSync(new URL('./styles/bieumau.css', import.meta.url), 'utf8')

  assert.match(portalCss, /--portal-red:\s*#9b1c24/i)
  assert.match(portalCss, /--portal-gold:\s*#d8a928/i)
  assert.match(portalCss, /--portal-green:\s*#0a6b3d/i)
  assert.match(portalCss, /--portal-green-dark:\s*#06492a/i)
  assert.match(portalCss, /\.top-agency-bar\s*\{[^}]*var\(--portal-green-dark\)/s)
  assert.match(portalCss, /\.main-header::after\s*\{[^}]*background:\s*var\(--portal-gold\)/s)
  assert.match(portalCss, /\.home-hero\s*\{[^}]*var\(--portal-green-dark\)[^}]*var\(--portal-navy-2\)/s)
  assert.doesNotMatch(portalCss, /\.home-hero\s*\{[^}]*var\(--portal-red-dark\)/s)
  assert.match(portalCss, /\.home-stats article\s*\{[^}]*--stat-accent:\s*var\(--portal-green\)/s)
  assert.doesNotMatch(portalCss, /\.home-stats article:nth-child\(/s)
  assert.match(portalCss, /\.home-quick-card\s*\{[^}]*--quick-color:\s*var\(--portal-green\)/s)
  assert.doesNotMatch(portalCss, /\.home-quick-card:nth-child\(/s)
  assert.match(portalCss, /\.agency-footer\s*\{[^}]*background:\s*#10261d/s)
  assert.match(courseCss, /\.course-page-heading\s*\{[^}]*var\(--portal-green-dark[^}]*var\(--portal-navy-2/s)
  assert.match(formCss, /--bm-primary:\s*var\(--portal-red\)/s)
  assert.match(formCss, /--bm-support:\s*var\(--portal-green\)/s)
})

test('footer presents institutional identity navigation and system status semantically', () => {
  const footer = readFileSync(new URL('./components/layout/Footer.jsx', import.meta.url), 'utf8')
  const css = readFileSync(new URL('./styles/portal.css', import.meta.url), 'utf8')

  assert.match(footer, /className="footer-logo"[^>]+src="\/assets\/logo-dhan\.jpg"/s)
  assert.match(footer, /<nav className="footer-nav" aria-label="Liên kết nhanh"/s)
  assert.match(footer, /<address className="footer-address">/s)
  assert.match(footer, /className="footer-classification"/s)
  assert.match(css, /\.footer-identity\s*\{[^}]*display:\s*flex/s)
  assert.match(css, /\.footer-logo\s*\{[^}]*width:\s*56px[^}]*border-radius:\s*50%/s)
  assert.match(css, /\.footer-status-card\s*\{[^}]*border:\s*1px solid rgba\(255,255,255,.1\)/s)
  assert.match(css, /\.footer-bottom\s*\{[^}]*padding:\s*0[^}]*text-align:\s*initial/s)
  assert.match(css, /\.footer-bottom-inner\s*\{[^}]*display:\s*flex[^}]*justify-content:\s*space-between/s)
})

test('home hero reuses the school seal as a trusted institutional anchor', () => {
  const home = readFileSync(new URL('./pages/HomePage.jsx', import.meta.url), 'utf8')
  assert.match(home, /className="home-emblem"[\s\S]*?<img[^>]+src="\/assets\/logo-dhan\.jpg"[^>]+alt=""/s)
})

test('mobile home grid items are allowed to shrink without horizontal overflow', () => {
  const css = readFileSync(new URL('./styles/portal.css', import.meta.url), 'utf8')
  assert.match(css, /\.home-hero__content\s*\{[^}]*min-width:\s*0/s)
  assert.match(css, /\.home-hero h1\s*\{[^}]*overflow-wrap:\s*anywhere/s)
  assert.match(css, /\.home-stats article\s*\{[^}]*min-width:\s*0/s)
  assert.match(css, /@media \(max-width: 768px\)[\s\S]*?\.home-stats\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/s)
})

test('mobile header keeps refresh available and the full school name readable', () => {
  const css = readFileSync(new URL('./styles/portal.css', import.meta.url), 'utf8')
  assert.match(css, /@media \(max-width: 480px\)[\s\S]*?\.portal-icon-button\s*\{[^}]*display:\s*inline-flex/s)
  assert.match(css, /@media \(max-width: 480px\)[\s\S]*?\.brand-kicker\s*\{[^}]*display:\s*none/s)
  assert.match(css, /@media \(max-width: 480px\)[\s\S]*?\.brand-text strong\s*\{[^}]*overflow:\s*visible[^}]*white-space:\s*normal/s)
})

test('form editor controls meet touch targets and keep gold action text readable', () => {
  const css = readFileSync(new URL('./styles/bieumau.css', import.meta.url), 'utf8')
  assert.match(css, /\.bm-btn\s*\{[^}]*min-height:\s*44px/s)
  assert.match(css, /\.bm-zoom-controls\s*\{[^}]*height:\s*44px/s)
  assert.match(css, /\.bm-zoom-btn\s*\{[^}]*min-width:\s*44px/s)
  assert.match(css, /\.bm-btn-purple\s*\{[^}]*color:\s*#2d2100/s)
})
