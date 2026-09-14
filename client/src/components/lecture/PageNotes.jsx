import React, { useEffect, useRef, useState } from 'react';
import { learningService } from '../../services/learningService';

export default function PageNotes({ lectureId, fileId, pdfPage }) {
  const [notes, setNotes] = useState([]), [content, setContent] = useState(''), [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [hasMore, setHasMore] = useState(false);
  const scope = `${lectureId}:${fileId}:${pdfPage}`;
  const current = useRef(scope); current.current = scope;
  useEffect(() => {
    setNotes([]); setContent(''); setEditing(null); setError(''); setHasMore(false);
    if (!fileId || !pdfPage) return;
    const controller = new AbortController();
    setBusy(true);
    learningService.notes(lectureId, fileId, pdfPage, 0, controller.signal).then(data => {
      if (current.current === scope) { setNotes(data.items); setHasMore(data.hasMore); }
    }).catch(e => { if (!controller.signal.aborted) setError(e.response?.data?.message || 'Không tải được ghi chú.'); })
      .finally(() => { if (current.current === scope) setBusy(false); });
    return () => controller.abort();
  }, [scope]);
  const save = async () => {
    if (!content.trim() || busy) return;
    setBusy(true); setError('');
    try {
      const note = editing ? await learningService.editNote(editing, { content, pdfPage }) : await learningService.addNote(lectureId, fileId, { content, pdfPage });
      if (current.current !== scope) return;
      setNotes(previous => editing ? previous.map(n => n.id === editing ? note : n) : [...previous, note]);
      setContent(''); setEditing(null);
    } catch (e) { if (current.current === scope) setError(e.response?.data?.message || 'Không lưu được ghi chú.'); }
    finally { if (current.current === scope) setBusy(false); }
  };
  const remove = async id => {
    setBusy(true);
    try { await learningService.deleteNote(id); if (current.current === scope) setNotes(ns => ns.filter(n => n.id !== id)); }
    catch (e) { if (current.current === scope) setError(e.response?.data?.message || 'Không xóa được ghi chú.'); }
    finally { if (current.current === scope) setBusy(false); }
  };
  const more = async () => {
    setBusy(true);
    try {
      const data = await learningService.notes(lectureId, fileId, pdfPage, notes.at(-1)?.id);
      if (current.current === scope) { setNotes(ns => [...ns, ...data.items]); setHasMore(data.hasMore); }
    } catch (e) { if (current.current === scope) setError('Không tải được ghi chú tiếp theo.'); }
    finally { if (current.current === scope) setBusy(false); }
  };
  if (!fileId || !pdfPage) return <p className="notes-caption">Mở một trang PDF để xem và thêm ghi chú.</p>;
  return <>
    <p className="notes-caption">Ghi chú trang <strong>{pdfPage}</strong></p>
    {error && <p role="alert">{error}</p>}
    <textarea className="study-notes-editor" aria-label="Nội dung ghi chú" value={content} maxLength={10000} onChange={e => setContent(e.target.value)} />
    <button className="btn-notes-tool" disabled={busy || !content.trim()} onClick={save}>{editing ? 'Lưu thay đổi' : 'Thêm ghi chú'}</button>
    {editing && <button className="btn-notes-tool" onClick={() => { setEditing(null); setContent(''); }}>Hủy sửa</button>}
    {busy && <p role="status">Đang xử lý…</p>}
    {!busy && !notes.length && !error && <p className="notes-caption">Trang này chưa có ghi chú.</p>}
    {notes.map(note => <article key={note.id} style={{ padding: 12, borderBottom: '1px solid #ddd' }}>
      <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{note.content}</p>
      <button className="btn-notes-tool" disabled={busy} onClick={() => { setEditing(note.id); setContent(note.content); }}>Sửa</button>
      <button className="btn-notes-tool" disabled={busy} onClick={() => remove(note.id)}>Xóa</button>
    </article>)}
    {hasMore && <button disabled={busy} onClick={more}>Xem thêm ghi chú</button>}
  </>;
}
