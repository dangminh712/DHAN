import React, { useState, useEffect } from 'react';
import { FileCode, Download, Loader2, Copy, Check, AlertCircle } from 'lucide-react';

export default function TextViewer({ url, fileName, downloadUrl }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        if (!isCancelled) {
          setContent(text);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(err.message || 'Không thể nạp văn bản');
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [url]);

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const effectiveDownloadUrl = downloadUrl || url;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[420px] text-slate-300">
        <Loader2 className="w-10 h-10 text-sky-400 animate-spin mb-3" />
        <h4 className="text-sm font-semibold text-white">Đang tải nội dung văn bản...</h4>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-10 min-h-[420px] text-center">
        <AlertCircle className="w-10 h-10 text-amber-400 mb-3" />
        <h4 className="text-base font-bold text-white mb-1">Không thể mở trực tiếp văn bản</h4>
        <p className="text-xs text-slate-400 max-w-md mb-4">{error}</p>
        <a
          href={effectiveDownloadUrl}
          download={fileName}
          className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Tải tệp về máy</span>
        </a>
      </div>
    );
  }

  const lines = content.split('\n');

  return (
    <div className="flex flex-col h-full w-full bg-slate-100 select-text overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200 text-xs text-slate-700 shadow-sm">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-blue-600" />
          <span className="font-bold text-slate-900 truncate max-w-xs">{fileName}</span>
          <span className="text-[11px] text-slate-500 font-semibold">({lines.length} dòng)</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
          </button>

          <a
            href={effectiveDownloadUrl}
            download={fileName}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải về</span>
          </a>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 bg-slate-100 font-mono text-xs text-slate-800 leading-relaxed">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 overflow-x-auto">
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="w-12 pr-4 text-right text-slate-400 select-none text-[11px] align-top border-r border-slate-100 font-sans">
                    {idx + 1}
                  </td>
                  <td className="pl-4 whitespace-pre-wrap break-all text-slate-800">{line || ' '}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
