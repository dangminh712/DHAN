import React, { useEffect, useMemo, useRef } from 'react';
import PdfReader from './PdfReader';
import { createProgressSaver } from '../../learningProgress';
import { progressSender } from '../../services/learningService';

function useSaver(lectureId, delay, onError) {
  const error = useRef(onError); error.current = onError;
  const saver = useMemo(() => createProgressSaver(progressSender(lectureId), e => error.current?.(e.message), delay), [lectureId]);
  useEffect(() => {
    const flush = () => { saver.flush(); };
    const visibility = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('pagehide', flush); document.addEventListener('visibilitychange', visibility);
    return () => { window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', visibility); flush(); };
  }, [saver]);
  return saver;
}

export function StudyPdf({
  lectureId,
  fileId,
  partId,
  initialPage,
  url,
  fileName,
  downloadUrl,
  canDownload = true,
  onPage,
  onError
}) {
  const saver = useSaver(lectureId, 2000, onError);
  return (
    <PdfReader
      url={url}
      initialPage={initialPage}
      fileName={fileName}
      downloadUrl={downloadUrl}
      canDownload={canDownload}
      onError={onError}
      onPage={(page, total, changed) => {
        onPage(page);
        if (changed) saver.schedule({ partId, fileId, lastPdfPage: page });
      }}
    />
  );
}

export function ResumeVideo({ lectureId, fileId, initialSecond = 0, url, onComplete, onError }) {
  const saver = useSaver(lectureId, 60000, onError);
  const resumed = useRef(false), lastSent = useRef(Date.now()), completed = useRef(false);
  const lastPosition = useRef(null);
  const sample = (video, force = false) => {
    if (!resumed.current || !Number.isFinite(video.duration) || video.duration <= 0 || !Number.isFinite(video.currentTime)) return;
    if (lastPosition.current !== video.currentTime) {
      lastPosition.current = video.currentTime;
      saver.schedule({ partId: 2, fileId, lastVideoSecond: video.currentTime, videoDurationSecond: video.duration });
    }
    if (video.currentTime >= video.duration * .9 && !completed.current) {
      completed.current = true; force = true; onComplete?.();
    }
    if (force || Date.now() - lastSent.current >= 30000) { lastSent.current = Date.now(); saver.flush(); }
  };
  return <video controls preload="metadata" className="study-video-player" src={url}
    onLoadedMetadata={e => { e.currentTarget.currentTime = Math.min(Math.max(0, initialSecond), Math.max(0, e.currentTarget.duration - .1)); resumed.current = true; }}
    onTimeUpdate={e => sample(e.currentTarget)} onPause={e => sample(e.currentTarget, true)} onEnded={e => sample(e.currentTarget, true)}
    onError={() => onError?.('Không thể phát video. Kiểm tra file hoặc định dạng video.')} />;
}
