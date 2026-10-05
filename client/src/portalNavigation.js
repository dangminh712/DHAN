export const portalNavigation = [
  { id: 'home', label: 'Trang chủ', href: '#/', path: '/', icon: 'home', exact: true },
  { id: 'courses', label: 'Môn học', href: '#/mon-hoc', path: '/mon-hoc', icon: 'courses' },
  { id: 'student', label: 'Cổng Học viên', href: '#/hoc-vien', path: '/hoc-vien', icon: 'student' },
  { id: 'teacher', label: 'Phòng Giảng viên', href: '#/giang-vien', path: '/giang-vien', icon: 'teacher' },
  { id: 'forms', label: 'Biểu mẫu CAND', href: '#/bieu-mau', path: '/bieu-mau', icon: 'forms', badge: 'Mới' },
  { id: 'academic', label: 'Khoa & Bộ môn', href: '#/academic', path: '/academic', icon: 'academic' },
  { id: 'accounts', label: 'Cấp tài khoản', href: '#/cap-tai-khoan', path: '/cap-tai-khoan', icon: 'accounts' },
  { id: 'admin', label: 'Quản trị', href: '#/admin', path: '/admin', icon: 'admin' },
  { id: 'database', label: 'Cơ sở dữ liệu', href: '#/dbms', path: '/dbms', icon: 'database' },
]

export function isPortalRouteActive(item, route = '/') {
  const normalizedRoute = (route || '/').split('?')[0]
  if (item.exact) return normalizedRoute === item.path
  return normalizedRoute === item.path || normalizedRoute.startsWith(`${item.path}/`)
}
