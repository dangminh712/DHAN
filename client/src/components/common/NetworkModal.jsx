import React from 'react';
import { Server, X } from 'lucide-react';

export default function NetworkModal({ isOpen, onClose, networkInfo, onCopy }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Server size={20} color="#FEF08A" />
            <h3>THÔNG SỐ MÁY CHỦ MẠNG NỘI BỘ (INTRANET)</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          <div style={{ background: '#FEF9C3', border: '1px solid #FDE047', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#854D0E' }}>
            Để máy tính hoặc điện thoại của học viên/giảng viên khác cùng mạng LAN truy cập vào hệ thống bài giảng:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>Tên máy chủ chủ quản:</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0B1E36' }}>{networkInfo?.machineName || 'localhost'}</div>
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>Địa chỉ IP mạng LAN nội bộ:</div>
              {networkInfo?.lanIps && networkInfo.lanIps.length > 0 ? (
                networkInfo.lanIps.map((ip, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                    <code style={{ fontSize: '14px', fontWeight: 700, color: '#A31A1A' }}>http://{ip}:{networkInfo?.clientPort || 5173}</code>
                    <button
                      className="sha-badge"
                      onClick={() => onCopy(`http://${ip}:${networkInfo?.clientPort || 5173}`, `ip-${idx}`)}
                    >
                      Sao chép link
                    </button>
                  </div>
                ))
              ) : (
                <code style={{ fontSize: '14px', fontWeight: 700, color: '#A31A1A' }}>http://localhost:5173</code>
              )}
            </div>

            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>Chế độ cơ sở dữ liệu:</div>
              <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#059669' }}>
                {networkInfo?.storageMode || 'MySQL 8.0 (training_management)'}
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 20px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', textAlign: 'right' }}>
          <button className="btn-icon-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
