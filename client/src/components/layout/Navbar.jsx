import React from 'react'
import { BookOpen, Building2, Database, FileText, GraduationCap, House, Presentation, ShieldCheck, UserRoundPlus } from 'lucide-react'
import { isPortalRouteActive, portalNavigation } from '../../portalNavigation'

const icons = {
  home: House,
  courses: BookOpen,
  student: GraduationCap,
  teacher: Presentation,
  forms: FileText,
  academic: Building2,
  accounts: UserRoundPlus,
  admin: ShieldCheck,
  database: Database,
}

export default function Navbar({ currentRoute }) {
  return (
    <nav className="nav-bar" aria-label="Điều hướng chính">
      <div className="nav-container">
        {portalNavigation.map((item) => {
          const Icon = icons[item.icon]
          const active = isPortalRouteActive(item, currentRoute)
          return (
            <a
              key={item.id}
              href={item.href}
              className={`nav-item ${item.id === 'home' ? 'nav-item--home' : ''} ${active ? 'active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={item.id === 'home' ? 18 : 16} className="nav-item__icon" aria-hidden="true" />
              <span>{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </a>
          )
        })}
      </div>
    </nav>
  )
}
