import React from 'react';
import { Shield } from 'lucide-react';

export default function LoadingSpinner({ text = 'Đang tải dữ liệu nghiệp vụ...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <div className="relative flex items-center justify-center">
        <div className="w-14 h-14 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
        <Shield className="w-6 h-6 text-red-600 absolute" />
      </div>
      <p className="text-sm font-medium text-slate-600 animate-pulse">{text}</p>
    </div>
  );
}
