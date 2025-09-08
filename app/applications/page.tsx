'use client';

import { useState, useEffect } from 'react';
import { FiDownload, FiPlus, FiCalendar, FiUser } from 'react-icons/fi';
import { ApplicationStatus } from '@/app/actions/applications';

export default function ApplicationsPage() {
  // ... giữ nguyên state và các hàm khác ...

  async function handleExport() {
    try {
      const response = await fetch('/api/exports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'applications',
          data: applications
        })
      });

      const data = await response.json();
      if (data.success) {
        // Trigger download
        const link = document.createElement('a');
        link.href = `/exports/${data.data.path}`;
        link.download = data.data.path;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  }

  // ... giữ nguyên phần code còn lại ...
}