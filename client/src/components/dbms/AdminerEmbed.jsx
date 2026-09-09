import React, { useState } from 'react';
import { Database, ExternalLink, RefreshCw, Layers, CheckCircle2 } from 'lucide-react';

export default function AdminerEmbed({ overview, onRefresh }) {
  const [iframeKey, setIframeKey] = useState(1);

  const refreshIframe = () => {
    setIframeKey((prev) => prev + 1);
    if (onRefresh) onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white border border-slate-700 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-600/30 border border-red-500/50 flex items-center justify-center text-red-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white">MySQL 8.x Web Console</span>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-mono">
                  Online 127.0.0.1:3307
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Cơ sở dữ liệu: <strong className="text-amber-300 font-mono">training_management</strong> •
                Tổng cộng <strong>27 bảng dữ liệu</strong> đã chuẩn hóa 3NF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshIframe}
              className="px-3.5 py-2 bg-slate-700/80 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-600"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Làm mới</span>
            </button>
            <a
              href="http://localhost:8080"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
            >
              <span>Mở tab riêng</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* 27 Tables Architectural Grid Breakdown */}
      {overview?.tableStats && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-red-600" />
              <span>Hiện trạng 27 Bảng Dữ Liệu Thực Tế trong MySQL</span>
            </h3>
            <span className="text-xs text-slate-500">
              27/27 bảng có dữ liệu hoạt động
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {overview.tableStats.map((tbl) => (
              <div
                key={tbl.tableName}
                className="p-2.5 bg-white rounded-lg border border-slate-200 hover:border-red-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-mono font-bold text-slate-800 truncate" title={tbl.tableName}>
                    {tbl.tableName}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {tbl.rowCount}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 truncate" title={tbl.description}>
                  {tbl.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Embedded Adminer Web Console (Port 8080) */}
      <div className="rounded-2xl border border-slate-300 overflow-hidden bg-white shadow-sm">
        <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Giao diện Adminer Database Console • Cổng nội bộ 8080</span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">http://localhost:8080</span>
        </div>
        <iframe
          key={iframeKey}
          src="http://localhost:8080"
          title="Adminer MySQL Web Console"
          className="w-full h-[720px] border-0"
        />
      </div>
    </div>
  );
}
