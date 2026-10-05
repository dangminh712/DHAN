import React, { useEffect, useRef, useState } from 'react';
import mpegts from 'mpegts.js';
import { AlertCircle, Download, Film } from 'lucide-react';

export default function UniversalVideoPlayer({
  src,
  fileName = '',
  className = '',
  style = {},
  autoPlay = true,
  controls = true,
  controlsList,
  onError,
}) {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const isFlv = Boolean(
    fileName?.toLowerCase().endsWith('.flv') ||
    src?.toLowerCase().includes('.flv')
  );

  useEffect(() => {
    setError(null);
    setLoading(true);

    const videoEl = videoRef.current;
    if (!videoEl || !src) return;

    if (isFlv) {
      if (!mpegts.isSupported()) {
        setError('Trình duyệt hiện tại không hỗ trợ giải mã trực tiếp luồng video FLV.');
        setLoading(false);
        return;
      }

      try {
        const player = mpegts.createPlayer(
          {
            type: 'flv',
            isLive: false,
            url: src,
          },
          {
            enableWorker: false,
            lazyLoad: false,
            autoCleanupSourceBuffer: true,
            seekType: 'range',
          }
        );

        playerRef.current = player;
        player.attachMediaElement(videoEl);
        player.load();

        player.on(mpegts.Events.ERROR, (errType, errDetail, errInfo) => {
          console.error('[UniversalVideoPlayer] FLV playback error:', errType, errDetail, errInfo);
          setError(`Lỗi giải mã FLV (${errType}: ${errDetail})`);
          onError?.(errInfo);
        });

        player.on(mpegts.Events.MEDIA_INFO, () => {
          setLoading(false);
        });

        if (autoPlay) {
          const playPromise = player.play();
          if (playPromise && playPromise.catch) {
            playPromise.catch((e) => {
              // Autoplay policy might require user interaction
              console.warn('[UniversalVideoPlayer] Autoplay prevented:', e);
            });
          }
        }
      } catch (err) {
        console.error('[UniversalVideoPlayer] Failed to initialize mpegts player:', err);
        setError(err.message || 'Không thể khởi tạo trình phát FLV.');
      }
    } else {
      // Standard video format (MP4, WebM...)
      videoEl.src = src;
      if (autoPlay) {
        videoEl.play().catch((e) => console.warn('[UniversalVideoPlayer] Autoplay prevented:', e));
      }
    }

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.pause();
          playerRef.current.unload();
          playerRef.current.detachMediaElement();
          playerRef.current.destroy();
        } catch (e) {
          console.warn('[UniversalVideoPlayer] Cleanup error:', e);
        }
        playerRef.current = null;
      }
      if (videoEl && !isFlv) {
        videoEl.src = '';
      }
    };
  }, [src, isFlv, autoPlay]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <video
        ref={videoRef}
        controls={controls}
        controlsList={controlsList}
        className={className}
        style={{
          display: error ? 'none' : 'block',
          maxHeight: '70vh',
          maxWidth: '100%',
          width: '100%',
          backgroundColor: '#000',
          ...style,
        }}
        onCanPlay={() => setLoading(false)}
        onError={(e) => {
          if (!isFlv) {
            setError('Trình duyệt không hỗ trợ hoặc không thể phát tệp video này.');
            onError?.(e);
          }
        }}
      >
        Trình duyệt của bạn không hỗ trợ thẻ video HTML5.
      </video>

      {error && (
        <div
          style={{
            padding: '24px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#F8FAFC',
            textAlign: 'center',
            maxWidth: '500px',
            margin: '20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
            <Film size={36} color="#60A5FA" />
          </div>
          <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: '#F1F5F9' }}>
            {fileName || 'Tài liệu video FLV'}
          </h4>
          <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '16px', lineHeight: 1.5 }}>
            {error}
          </p>
          <a
            href={src}
            download={fileName || 'video.flv'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#2563EB',
              color: '#FFFFFF',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            <Download size={16} /> Tải tệp FLV về máy để phát bằng VLC / MPC
          </a>
        </div>
      )}
    </div>
  );
}
