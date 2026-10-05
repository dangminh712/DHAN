import test from 'node:test'
import assert from 'node:assert/strict'
import { getPortalGreetingName } from './portalGreeting.js'

test('admin greeting uses the role instead of truncating the title', () => {
  assert.equal(getPortalGreetingName({ role: 'SUPER_ADMIN', fullName: 'Thiếu tướng, PGS.TS Quản trị viên' }), 'Quản trị viên')
})

test('teacher and student greetings keep a concise personal name', () => {
  assert.equal(getPortalGreetingName({ role: 'TEACHER', fullName: 'Đại tá Trần Minh Quang' }), 'Minh Quang')
  assert.equal(getPortalGreetingName({ role: 'STUDENT', fullName: 'Học viên Đặng Nhật Minh' }), 'Nhật Minh')
  assert.equal(getPortalGreetingName(null), 'đồng chí')
})
