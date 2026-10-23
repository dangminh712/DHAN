import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Presentation,
  UploadCloud,
  FileText,
  ShieldCheck,
  UserRoundPlus,
  Building2,
  Database,
  Server,
  GraduationCap,
  Sparkles,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  Layers,
  LockKeyhole,
  CheckCircle2,
  BookmarkCheck,
  HelpCircle
} from 'lucide-react';

export default function FunctionsHubPage({
  currentUser,
  onOpenUpload,
  onOpenNetwork,
  onSwitchUser,
  availableUsers = []
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');

  const roleLabel = currentUser?.role === 'SUPER_ADMIN'
    ? 'Quản trị viên'
    : currentUser?.role === 'TEACHER'
      ? 'Giảng viên'
      : 'Học viên';

  // Danh mục tất cả chức năng trong hệ thống
  const functionsList = [
    // 1. Giảng dạy & Học liệu
    {
      id: 'teacher-portal',
      title: 'Phòng làm việc Giảng viên',
      category: 'teaching',
      categoryLabel: 'Giảng dạy & Học liệu',
      role: 'TEACHER',
      roleBadge: 'Giảng viên',
      badgeColor: 'blue',
      icon: Presentation,
      iconBg: '#eff6ff',
      iconColor: '#2563eb',
      href: '#/giang-vien',
      description: 'Không gian làm việc riêng của giảng viên: quản lý danh sách học liệu đã tải lên, tài liệu môn phụ trách, và bài giảng điện tử cá nhân.',
      features: ['Quản lý học liệu cá nhân', 'Duyệt và phân loại bài giảng', 'Bộ lọc môn học chuyên trách'],
      actionLabel: 'Vào phòng làm việc',
      isHot: true
    },
    {
      id: 'lecture-creator',
      title: 'Studio Biên soạn Bài giảng điện tử',
      category: 'teaching',
      categoryLabel: 'Giảng dạy & Học liệu',
      role: 'TEACHER',
      roleBadge: 'Giảng viên',
      badgeColor: 'blue',
      icon: Sparkles,
      iconBg: '#fef3c7',
      iconColor: '#d97706',
      href: '#/tao-bai-giang',
      description: 'Công cụ trực quan cho phép giảng viên tự tạo các bài giảng số sinh động gồm slide kiến thức, video bài giảng, câu hỏi trắc nghiệm và câu hỏi khảo sát.',
      features: ['Tạo slide & câu hỏi tương tác', 'Xem trước trước khi xuất bản', 'Gắn kết môn học & bài học'],
      actionLabel: 'Mở Studio biên soạn',
      isNew: true
    },
    {
      id: 'upload-modal',
      title: 'Nạp học liệu số đa định dạng',
      category: 'teaching',
      categoryLabel: 'Giảng dạy & Học liệu',
      role: 'TEACHER',
      roleBadge: 'Cán bộ / Giảng viên',
      badgeColor: 'blue',
      icon: UploadCloud,
      iconBg: '#f0fdf4',
      iconColor: '#16a34a',
      onClick: onOpenUpload,
      description: 'Cửa sổ tải lên tệp tin tài liệu giáo trình, giáo án dạng Word (.docx), Excel (.xlsx), PDF, MP4 có gắn mức độ mật CAND và bộ môn phụ trách.',
      features: ['Tải Word, Excel, PDF, Video', 'Gán mã mật CAND (Mật, Tối mật)', 'Phân loại môn & khoa đào tạo'],
      actionLabel: 'Mở form nạp tài liệu',
      isModalAction: true
    },
    {
      id: 'courses-catalog',
      title: 'Kho Môn học & Học liệu số',
      category: 'teaching',
      categoryLabel: 'Giảng dạy & Học liệu',
      role: 'ALL',
      roleBadge: 'Toàn trường',
      badgeColor: 'emerald',
      icon: BookOpen,
      iconBg: '#ecfdf5',
      iconColor: '#059669',
      href: '#/mon-hoc',
      description: 'Cơ sở dữ liệu danh mục môn học đào tạo tại T04 theo từng kỳ học, niên khóa và chuyên ngành. Hỗ trợ tra cứu nhanh giáo trình và bài giảng chi tiết.',
      features: ['Xem mục lục chương & bài', 'Học trực tuyến bài giảng', 'Tải tài liệu tham khảo kèm theo'],
      actionLabel: 'Tra cứu môn học'
    },

    // 2. Quản trị & Hệ thống
    {
      id: 'admin-portal',
      title: 'Trung tâm Quản trị Hệ thống',
      category: 'admin',
      categoryLabel: 'Quản trị & Hệ thống',
      role: 'SUPER_ADMIN',
      roleBadge: 'Quản trị viên',
      badgeColor: 'red',
      icon: ShieldCheck,
      iconBg: '#fef2f2',
      iconColor: '#dc2626',
      href: '#/admin',
      description: 'Bảng điều khiển dành riêng cho Ban Giám hiệu và Quản trị viên: theo dõi Nhật ký an ninh mạng (Audit Log), thống kê lượt truy cập và tài nguyên máy chủ.',
      features: ['Nhật ký kiểm toán an toàn (Audit)', 'Thống kê người dùng & phiên', 'Kiểm soát mức độ mật tài liệu'],
      actionLabel: 'Vào Trung tâm Quản trị',
      isHot: true
    },
    {
      id: 'provisioning',
      title: 'Cấp tài khoản & Quản lý Học viên',
      category: 'admin',
      categoryLabel: 'Quản trị & Hệ thống',
      role: 'SUPER_ADMIN',
      roleBadge: 'Quản trị viên',
      badgeColor: 'red',
      icon: UserRoundPlus,
      iconBg: '#fdf2f8',
      iconColor: '#db2777',
      href: '#/cap-tai-khoan',
      description: 'Tiện ích tự động hóa cấp phát tài khoản học viên sĩ quan hàng loạt theo lớp, cấp mã tài khoản cá nhân, mật khẩu mặc định và quản lý trạng thái kích hoạt.',
      features: ['Cấp tài khoản theo lớp/khóa', 'Đặt lại mật khẩu học viên', 'Đồng bộ hồ sơ đào tạo T04'],
      actionLabel: 'Quản lý tài khoản'
    },
    {
      id: 'academic-org',
      title: 'Cơ cấu Tổ chức Khoa & Bộ môn',
      category: 'admin',
      categoryLabel: 'Quản trị & Hệ thống',
      role: 'ALL',
      roleBadge: 'Toàn trường',
      badgeColor: 'emerald',
      icon: Building2,
      iconBg: '#f5f3ff',
      iconColor: '#7c3aed',
      href: '#/academic',
      description: 'Sơ đồ cây tổ chức các Khoa nghiệp vụ, Bộ môn chuyên ngành của Trường Đại học An ninh nhân dân (Khoa NV1, NV2, Pháp luật, Ngoại ngữ...).',
      features: ['Tra cứu các Khoa & Bộ môn', 'Xem danh mục môn học thuộc khoa', 'Thông tin phụ trách chuyên môn'],
      actionLabel: 'Xem cơ cấu tổ chức'
    },

    // 3. Biểu mẫu & Nghiệp vụ CAND
    {
      id: 'forms-cand',
      title: 'Hệ thống Biểu mẫu Nghiệp vụ CAND',
      category: 'forms',
      categoryLabel: 'Nghiệp vụ & Biểu mẫu',
      role: 'ALL',
      roleBadge: 'Toàn trường',
      badgeColor: 'emerald',
      icon: FileText,
      iconBg: '#fffbeb',
      iconColor: '#b45309',
      href: '#/bieu-mau',
      description: 'Kho lưu trữ chuẩn hóa các mẫu văn bản, báo cáo công tác, tờ trình, phiếu chấm điểm và giáo án điện tử theo quy chuẩn của Bộ Công an.',
      features: ['Mẫu tờ trình, biên bản, kế hoạch', 'Tải mẫu Word & Excel gốc', 'Phân loại theo lĩnh vực công tác'],
      actionLabel: 'Mở Kho biểu mẫu',
      badgeText: 'Mới'
    },
    {
      id: 'student-portal',
      title: 'Cổng Học viên Sĩ quan',
      category: 'forms',
      categoryLabel: 'Nghiệp vụ & Biểu mẫu',
      role: 'STUDENT',
      roleBadge: 'Học viên / Tham khảo',
      badgeColor: 'emerald',
      icon: GraduationCap,
      iconBg: '#e0f2fe',
      iconColor: '#0284c7',
      href: '#/hoc-vien',
      description: 'Giao diện trải nghiệm học tập của học viên: tìm kiếm học liệu số được phân quyền, học bài giảng đa phương tiện và làm bài tập đánh giá.',
      features: ['Tra cứu học liệu được phân quyền', 'Làm bài kiểm tra & câu hỏi ôn tập', 'Xem lịch sử học tập'],
      actionLabel: 'Xem góc nhìn Học viên'
    },

    // 4. Kỹ thuật & CSDL
    {
      id: 'dbms-admin',
      title: 'Quản trị Cơ sở dữ liệu (27 Bảng)',
      category: 'system',
      categoryLabel: 'Kỹ thuật & CSDL',
      role: 'SUPER_ADMIN',
      roleBadge: 'Quản trị viên',
      badgeColor: 'red',
      icon: Database,
      iconBg: '#fef3c7',
      iconColor: '#92400e',
      href: '#/dbms',
      description: 'Trình quản lý trực quan toàn bộ 27 bảng dữ liệu quan hệ của hệ thống: xem dữ liệu, cấu trúc khóa ngoại, số lượng bản ghi và thực thi truy vấn nội bộ.',
      features: ['Duyệt 27 bảng dữ liệu MySQL', 'Kiểm tra ràng buộc quan hệ', 'Theo dõi dung lượng & bản ghi'],
      actionLabel: 'Khám phá CSDL 27 bảng',
      badgeText: '27 Bảng'
    },
    {
      id: 'network-info',
      title: 'Thông số Máy chủ & Mạng nội bộ',
      category: 'system',
      categoryLabel: 'Kỹ thuật & CSDL',
      role: 'ALL',
      roleBadge: 'Kỹ thuật viên / BGH',
      badgeColor: 'emerald',
      icon: Server,
      iconBg: '#f1f5f9',
      iconColor: '#475569',
      onClick: onOpenNetwork,
      description: 'Kiểm tra nhanh tình trạng kết nối máy chủ Intranet: IP máy chủ cục bộ, cổng mạng (Vite, API ASP.NET Core, MySQL), trạng thái đường truyền LAN.',
      features: ['Địa chỉ IP mạng nội bộ', 'Cổng kết nối Backend & Database', 'Kiểm tra độ trễ mạng'],
      actionLabel: 'Xem thông số máy chủ',
      isModalAction: true
    }
  ];

  // Lọc danh sách theo từ khóa, danh mục và vai trò
  const filteredFunctions = useMemo(() => {
    return functionsList.filter((item) => {
      // 1. Lọc theo từ khóa
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);
        const matchesCategory = item.categoryLabel.toLowerCase().includes(query);
        const matchesFeatures = item.features.some((f) => f.toLowerCase().includes(query));
        if (!matchesTitle && !matchesDesc && !matchesCategory && !matchesFeatures) {
          return false;
        }
      }

      // 2. Lọc theo danh mục
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // 3. Lọc theo vai trò
      if (selectedRoleFilter === 'TEACHER' && item.role !== 'TEACHER' && item.role !== 'ALL') {
        return false;
      }
      if (selectedRoleFilter === 'SUPER_ADMIN' && item.role !== 'SUPER_ADMIN' && item.role !== 'ALL') {
        return false;
      }

      return true;
    });
  }, [functionsList, searchTerm, selectedCategory, selectedRoleFilter]);

  const categories = [
    { id: 'all', label: 'Tất cả chức năng' },
    { id: 'teaching', label: 'Giảng dạy & Học liệu' },
    { id: 'admin', label: 'Quản trị & Hệ thống' },
    { id: 'forms', label: 'Nghiệp vụ & Biểu mẫu' },
    { id: 'system', label: 'Kỹ thuật & CSDL' }
  ];

  return (
    <div className="hub-page">
      {/* Banner đầu trang phong cách Nhà nước CAND */}
      <section className="hub-hero">
        <div className="hub-hero__container">
          <div className="hub-hero__badge">
            <Layers size={14} />
            <span>DANH MỤC NGHIỆP VỤ & TIỆN ÍCH T04</span>
          </div>
          <h1 className="hub-hero__title">
            Trung tâm Chức năng Hệ thống
          </h1>
          <p className="hub-hero__desc">
            Tổng hợp toàn diện các mô-đun phục vụ công tác giảng dạy, biên soạn bài giảng số,
            quản trị người dùng và giám sát an toàn thông tin tại Trường Đại học An ninh nhân dân.
          </p>

          {/* Hộp trạng thái vai trò người dùng hiện tại */}
          <div className="hub-user-strip">
            <div className="hub-user-strip__left">
              <span className="hub-user-dot" />
              <span>Đang làm việc với tư cách:</span>
              <strong>{currentUser?.fullName || 'Khách nội bộ'}</strong>
              <span className="hub-user-role-tag">{roleLabel}</span>
              <span className="hub-user-clearance">
                <LockKeyhole size={12} /> {currentUser?.maxClearance || 'Nội bộ'}
              </span>
            </div>

            {availableUsers.length > 0 && onSwitchUser && (
              <div className="hub-user-strip__right">
                <span className="hub-switch-hint">Chuyển vai trò thử nghiệm:</span>
                <select
                  value={currentUser?.username || ''}
                  onChange={(e) => onSwitchUser(e.target.value)}
                  className="hub-role-select"
                  aria-label="Chuyển vai trò người dùng"
                >
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.username}>
                      {u.fullName} ({u.role === 'SUPER_ADMIN' ? 'Admin' : u.role === 'TEACHER' ? 'Giảng viên' : 'Học viên'})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Vùng thanh lọc & tìm kiếm */}
      <section className="hub-controls-section">
        <div className="hub-controls-container">
          {/* Ô tìm kiếm thông minh */}
          <div className="hub-search-box">
            <Search size={18} className="hub-search-icon" aria-hidden="true" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nhập tên chức năng, nghiệp vụ, từ khóa (ví dụ: bài giảng, tài khoản, biểu mẫu, csdl)..."
              aria-label="Tìm kiếm chức năng hệ thống"
            />
            {searchTerm && (
              <button
                type="button"
                className="hub-search-clear"
                onClick={() => setSearchTerm('')}
                title="Xóa tìm kiếm"
              >
                ✕
              </button>
            )}
          </div>

          {/* Dải nút lọc theo nhóm & vai trò */}
          <div className="hub-filter-row">
            <div className="hub-category-pills" role="tablist" aria-label="Bộ lọc nhóm chức năng">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={selectedCategory === cat.id}
                  className={`hub-category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="hub-role-pills" aria-label="Bộ lọc theo thẩm quyền">
              <span className="hub-role-filter-label"><Filter size={13} /> Thẩm quyền:</span>
              <button
                type="button"
                className={`hub-role-pill ${selectedRoleFilter === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedRoleFilter('all')}
              >
                Tất cả
              </button>
              <button
                type="button"
                className={`hub-role-pill ${selectedRoleFilter === 'TEACHER' ? 'active' : ''}`}
                onClick={() => setSelectedRoleFilter('TEACHER')}
              >
                Giảng viên
              </button>
              <button
                type="button"
                className={`hub-role-pill ${selectedRoleFilter === 'SUPER_ADMIN' ? 'active' : ''}`}
                onClick={() => setSelectedRoleFilter('SUPER_ADMIN')}
              >
                Quản trị viên
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Lưới các ô chức năng (Card Tiles) */}
      <main className="hub-content">
        <div className="hub-grid-header">
          <div className="hub-grid-count">
            Hiển thị <strong>{filteredFunctions.length}</strong> chức năng nghiệp vụ
            {selectedCategory !== 'all' && <span> thuộc nhóm đã chọn</span>}
            {searchTerm && <span> khớp với "{searchTerm}"</span>}
          </div>
          <div className="hub-quick-tips">
            <BookmarkCheck size={14} />
            <span>Bấm vào từng ô để mở trực tiếp trang làm việc hoặc thao tác</span>
          </div>
        </div>

        {filteredFunctions.length === 0 ? (
          <div className="hub-empty-state">
            <HelpCircle size={44} className="hub-empty-icon" />
            <h3>Không tìm thấy chức năng phù hợp</h3>
            <p>Vui lòng thử tìm kiếm bằng từ khóa khác hoặc bấm đặt lại các bộ lọc phía trên.</p>
            <button
              type="button"
              className="portal-button portal-button--primary"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedRoleFilter('all');
              }}
            >
              Đặt lại toàn bộ lọc
            </button>
          </div>
        ) : (
          <div className="hub-grid">
            {filteredFunctions.map((item) => {
              const IconComp = item.icon;
              return (
                <article key={item.id} className="hub-card">
                  <div className="hub-card__top">
                    <div
                      className="hub-card__icon"
                      style={{ backgroundColor: item.iconBg, color: item.iconColor }}
                    >
                      <IconComp size={24} aria-hidden="true" />
                    </div>
                    <div className="hub-card__badges">
                      <span className={`hub-badge hub-badge--${item.badgeColor || 'gray'}`}>
                        {item.roleBadge}
                      </span>
                      {item.badgeText && (
                        <span className="hub-badge hub-badge--accent">
                          {item.badgeText}
                        </span>
                      )}
                      {item.isHot && (
                        <span className="hub-badge hub-badge--hot">
                          Thường dùng
                        </span>
                      )}
                    </div>
                  </div>

                  <h2 className="hub-card__title">{item.title}</h2>
                  <p className="hub-card__desc">{item.description}</p>

                  <div className="hub-card__features">
                    <span className="hub-features-label">Khả năng chính:</span>
                    <ul>
                      {item.features.map((feat, idx) => (
                        <li key={idx}>
                          <CheckCircle2 size={13} className="hub-feat-check" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="hub-card__footer">
                    {item.isModalAction ? (
                      <button
                        type="button"
                        onClick={item.onClick}
                        className="hub-card__action-btn hub-card__action-btn--modal"
                      >
                        <span>{item.actionLabel}</span>
                        <ArrowRight size={15} />
                      </button>
                    ) : (
                      <a
                        href={item.href}
                        className="hub-card__action-btn"
                      >
                        <span>{item.actionLabel}</span>
                        <ArrowRight size={15} />
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
