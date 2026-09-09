import React, { useState, useEffect } from 'react';
import { systemService } from '../services/systemService';
import AdminerEmbed from '../components/dbms/AdminerEmbed';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function DbmsPage() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await systemService.getOverview();
      setOverview(data);
    } catch (err) {
      console.error('Lỗi nạp tổng quan CSDL:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <LoadingSpinner text="Đang kết nối hệ quản trị CSDL MySQL 8.x..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <AdminerEmbed overview={overview} onRefresh={loadData} />
    </div>
  );
}
