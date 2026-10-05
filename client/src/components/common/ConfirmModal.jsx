import React, { useEffect } from 'react';
import { ShieldAlert, AlertTriangle, Info, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Xác nhận thao tác nghiệp vụ',
  message = '',
  subMessage = '',
  confirmText = 'Xác nhận thực hiện',
  cancelText = 'Hủy bỏ',
  variant = 'danger', // 'danger' | 'warning' | 'primary'
  isAlertOnly = false,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
      if (e.key === 'Enter' && isOpen && !isAlertOnly) {
        onConfirm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onConfirm, isAlertOnly]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';

  const headerBg = isDanger
    ? 'linear-gradient(135deg, #71151A 0%, #9B1C24 100%)'
    : isWarning
    ? 'linear-gradient(135deg, #78350F 0%, #B45309 100%)'
    : 'linear-gradient(135deg, #06492A 0%, #0A6B3D 100%)';

  const iconColor = isDanger ? '#FCA5A5' : isWarning ? '#FDE68A' : '#A7F3D0';
  const confirmBtnBg = isDanger ? '#9B1C24' : isWarning ? '#B45309' : '#0A6B3D';

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(11, 30, 25, 0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '480px',
          background: '#FFFFFF',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(11, 35, 25, 0.45)',
          border: '1px solid #CBD5E1',
          animation: 'slideUp 0.2s ease-out'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 20px',
            background: headerBg,
            borderBottom: '2px solid #D8A928',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#FFFFFF'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isDanger ? (
              <ShieldAlert size={22} color={iconColor} />
            ) : isWarning ? (
              <AlertTriangle size={22} color={iconColor} />
            ) : (
              <Info size={22} color={iconColor} />
            )}
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.01em' }}>
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            type="button"
            aria-label="Đóng"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.8)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '22px 24px', background: '#FAFAF7' }}>
          <p
            style={{
              margin: '0 0 8px 0',
              fontSize: '14px',
              lineHeight: '1.6',
              color: '#17231D',
              fontWeight: 500,
              whiteSpace: 'pre-line'
            }}
          >
            {message}
          </p>
          {subMessage && (
            <p
              style={{
                margin: '8px 0 0 0',
                fontSize: '12px',
                lineHeight: '1.5',
                color: '#5F6F66',
                background: '#F1F4EE',
                padding: '8px 12px',
                borderRadius: '6px',
                borderLeft: '3px solid #0A6B3D'
              }}
            >
              {subMessage}
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '14px 24px',
            background: '#FFFFFF',
            borderTop: '1px solid #DFE3DC',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
          }}
        >
          {!isAlertOnly && (
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#34453B',
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
            style={{
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: 700,
              color: '#FFFFFF',
              background: confirmBtnBg,
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
