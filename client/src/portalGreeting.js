export function getPortalGreetingName(user) {
  if (!user?.fullName) return 'đồng chí'
  if (user.role === 'SUPER_ADMIN') return 'Quản trị viên'

  const words = user.fullName.trim().split(/\s+/)
  return words.slice(-2).join(' ')
}
