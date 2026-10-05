import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { isPortalRouteActive, portalNavigation } from './portalNavigation.js'

test('portal navigation exposes complete semantic items', () => {
  assert.ok(portalNavigation.length >= 6)
  portalNavigation.forEach((item) => {
    assert.match(item.href, /^#\//)
    assert.ok(item.label.length > 0)
    assert.ok(item.icon.length > 0)
  })
})

test('home is active only at the root route', () => {
  const home = portalNavigation.find((item) => item.id === 'home')
  assert.equal(isPortalRouteActive(home, '/'), true)
  assert.equal(isPortalRouteActive(home, ''), true)
  assert.equal(isPortalRouteActive(home, '/mon-hoc'), false)
})

test('section routes remain active on their detail pages', () => {
  const courses = portalNavigation.find((item) => item.id === 'courses')
  assert.equal(isPortalRouteActive(courses, '/mon-hoc'), true)
  assert.equal(isPortalRouteActive(courses, '/mon-hoc/9'), true)
  assert.equal(isPortalRouteActive(courses, '/mon-hoc/9/chuong/2'), true)
  assert.equal(isPortalRouteActive(courses, '/academic'), false)
})

test('navbar preserves native anchor semantics', () => {
  const source = readFileSync(new URL('./components/layout/Navbar.jsx', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /role="listitem"/)
  assert.doesNotMatch(source, /role="list"/)
})

test('internal footer links do not use the external-link icon', () => {
  const source = readFileSync(new URL('./components/layout/Footer.jsx', import.meta.url), 'utf8')
  assert.doesNotMatch(source, /ExternalLink/)
})
