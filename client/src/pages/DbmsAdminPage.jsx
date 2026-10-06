import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Database, ExternalLink, Table2, RefreshCw, HardDrive, Gauge, AlertCircle, CheckCircle2 } from 'lucide-react';
import { diskUsage, fetchOverview, formatBytes, formatNumber } from '../dbmsOverview.js';
import '../styles/dbms.css';

function Metric({ icon: Icon, label, value, detail }) {
  return <article className="dbms-metric"><div className="dbms-metric-label"><Icon size={18} aria-hidden="true" />{label}</div><strong>{value}</strong><p>{detail}</p></article>;
}

export default function DbmsAdminPage() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);
  const [filter, setFilter] = useState('');
  const request = useRef(null);
  const loadOverview = async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError('');
    setOverview(null);
    try {
      const data = await fetchOverview(axios, controller.signal);
      if (controller.signal.aborted) return;
      setOverview(data);
      setUpdatedAt(new Date());
    } catch (err) {
      if (controller.signal.aborted) return;
      const status = err.response?.status;
      setError(status === 401 || status === 403
        ? 'Phiên đăng nhập hoặc quyền quản trị không hợp lệ. Vui lòng đăng nhập bằng tài khoản được cấp quyền.'
        : 'Không thể tải số liệu CSDL. Kiểm tra dịch vụ máy chủ và kết nối, sau đó thử lại.');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };
  useEffect(() => { loadOverview(); return () => request.current?.abort(); }, []);
  const capacity = overview ? diskUsage(overview.diskTotalBytes, overview.diskFreeBytes) : null;
  const tables = overview?.tableStats || [];
  const search = filter.trim().toLocaleLowerCase('vi');
  const filteredTables = tables.filter(table => [table.tableName, table.module, table.description].some(value => String(value || '').toLocaleLowerCase('vi').includes(search)));
  return <div className="portal-container dbms-page">
    <header className="dbms-header">
      <div className="dbms-heading"><span className="dbms-emblem"><Database size={28} aria-hidden="true" /></span><div><p className="dbms-eyebrow">QUẢN TRỊ HỆ THỐNG</p><h1>Cơ sở dữ liệu</h1><p>Theo dõi cấu trúc 27 bảng quan hệ, thời gian truy vấn và dung lượng lưu trữ nội bộ T04.</p></div></div>
      <div className="dbms-actions"><button type="button" onClick={loadOverview} disabled={loading} className="dbms-button"><RefreshCw size={17} aria-hidden="true" />{loading ? 'Đang kiểm tra…' : 'Làm mới số liệu CSDL'}</button></div>
    </header>
    <div className="dbms-status" role="status" aria-live="polite">{loading ? <><RefreshCw size={16} aria-hidden="true" />Đang tải số liệu từ máy chủ…</> : error ? <><AlertCircle size={16} aria-hidden="true" />Chưa xác nhận kết nối</> : <><CheckCircle2 size={16} aria-hidden="true" />Đã nhận số liệu từ máy chủ<span className="dbms-updated">Cập nhật {updatedAt?.toLocaleTimeString('vi-VN')}</span></>}</div>
    <div aria-busy={loading}>
      {loading && <div className="dbms-loading"><Database size={32} aria-hidden="true" /><p>Đang đọc thông tin bảng và dung lượng lưu trữ.</p></div>}
      {!loading && error && <div className="dbms-error" role="alert"><AlertCircle size={24} aria-hidden="true" /><div><h2>Không có số liệu để hiển thị</h2><p>{error}</p><button type="button" className="dbms-button" onClick={loadOverview}>Thử lại</button></div></div>}
      {!loading && overview && <>
        <section className="dbms-metrics" aria-label="Số liệu cơ sở dữ liệu">
          <Metric icon={Database} label="Cơ sở dữ liệu" value={overview.databaseName || 'Chưa có dữ liệu'} detail={overview.databaseEngine || 'Chưa có thông tin hệ quản trị'} />
          <Metric icon={Table2} label="Bảng quan hệ" value={formatNumber(overview.totalTables)} detail={`${formatNumber(overview.totalRows)} bản ghi${overview.totalRowsIsEstimate ? ' (ước tính)' : ''}`} />
          <Metric icon={HardDrive} label="Dữ liệu bảng" value={formatBytes(overview.databaseDataBytes)} detail={`Chỉ mục: ${formatBytes(overview.databaseIndexBytes)}`} />
          <Metric icon={Gauge} label="Truy vấn tổng quan" value={overview.queryDurationMs == null ? 'Chưa có dữ liệu' : `${formatNumber(overview.queryDurationMs)} ms`} detail="Thời gian truy vấn CSDL của lần lấy số liệu này." />
        </section>
        <section className="dbms-capacity dbms-panel" aria-labelledby="dbms-capacity-title"><div><p className="dbms-eyebrow">DUNG LƯỢNG HIỆN TẠI</p><h2 id="dbms-capacity-title">Lưu trữ & khả năng vận hành</h2><p>Dữ liệu bảng và chỉ mục là metadata trong CSDL. Tệp học liệu được lưu riêng; số byte học liệu dưới đây tính theo các tệp đang hoạt động trong danh mục.</p></div><div className="dbms-capacity-details"><dl><div><dt>Học liệu đang hoạt động</dt><dd>{formatBytes(overview.storageBytes)}</dd></div><div><dt>Ổ lưu trữ của máy chủ</dt><dd>{formatBytes(overview.diskTotalBytes)}</dd></div><div><dt>Dung lượng ổ còn trống</dt><dd>{formatBytes(overview.diskFreeBytes)}</dd></div></dl>{capacity && <><div className="dbms-capacity-caption"><span>Toàn bộ ổ đã sử dụng</span><strong>{formatNumber(capacity.percent)}%</strong></div><meter className="dbms-meter" min="0" max="100" value={capacity.percent} aria-label="Tỷ lệ dung lượng toàn bộ ổ đã sử dụng">{formatNumber(capacity.percent)}%</meter></>}<p className="dbms-note">Dung lượng ổ bao gồm các dữ liệu khác trên máy chủ. Thời gian truy vấn tổng quan không phải phép đo tải đồng thời; chưa có kết quả kiểm thử để xác định số người dùng tối đa.</p></div></section>
        <section className="dbms-panel" aria-labelledby="dbms-schema-title"><div className="dbms-panel-heading"><div><p className="dbms-eyebrow">CẤU TRÚC THỰC TẾ</p><h2 id="dbms-schema-title">Danh mục bảng</h2><p>{formatNumber(overview.foreignKeyCount)} khóa ngoại · {formatNumber(overview.indexCount)} chỉ mục</p></div><div className="dbms-filter"><label htmlFor="dbms-table-filter">Tìm bảng hoặc phân hệ</label><input id="dbms-table-filter" type="search" value={filter} onChange={event => setFilter(event.target.value)} placeholder="Tên bảng, phân hệ…" /></div></div>
          <p className="dbms-note">Số bản ghi có dấu ≈ là ước tính của hệ quản trị, có thể khác số đếm chính xác. Kích thước dữ liệu và chỉ mục được thống kê riêng.</p>
          <div className="dbms-table-wrap"><table className="dbms-table"><caption className="sr-only">Danh mục bảng và dung lượng từ cơ sở dữ liệu hiện tại</caption><thead><tr><th scope="col">Bảng / mô tả</th><th scope="col">Phân hệ</th><th scope="col">Bản ghi</th><th scope="col">Dữ liệu</th><th scope="col">Chỉ mục</th></tr></thead><tbody>{filteredTables.map(table => <tr key={table.tableName}><th scope="row" data-label="Bảng / mô tả"><code>{table.tableName}</code>{table.description && <span className="dbms-table-description">{table.description}</span>}</th><td data-label="Phân hệ">{table.module || 'Chưa phân nhóm'}</td><td data-label="Bản ghi">{table.rowCountIsEstimate && table.rowCount != null ? <abbr title="Số bản ghi ước tính">≈ </abbr> : null}{formatNumber(table.rowCount)}</td><td data-label="Dữ liệu">{formatBytes(table.dataBytes)}</td><td data-label="Chỉ mục">{formatBytes(table.indexBytes)}</td></tr>)}</tbody></table></div>
          {filteredTables.length === 0 && <p className="dbms-empty">{tables.length ? 'Không có bảng phù hợp với từ khóa.' : 'Máy chủ chưa trả về danh mục bảng.'}</p>}
          <p className="dbms-table-count" role="status">Hiển thị {filteredTables.length} / {tables.length} bảng</p>
        </section>
        <p className="dbms-footer-note">Cơ sở dữ liệu vận hành trên nền tảng MySQL 8.x mạng nội bộ T04 (cổng 3307), tuân thủ tiêu chuẩn an toàn thông tin lực lượng CAND.</p>
      </>}
    </div>
  </div>;
}
