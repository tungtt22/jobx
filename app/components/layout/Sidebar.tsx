'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiBriefcase } from 'react-icons/fi';
import { FiBookmark } from 'react-icons/fi';
import { FiClock } from 'react-icons/fi';
import { FiSettings } from 'react-icons/fi';
import { FiDatabase } from 'react-icons/fi';
import NotificationBell from '../notifications/NotificationBell';

const menuItems = [
  { href: '/', label: 'Search Jobs', icon: FiBriefcase },
  { href: '/collected', label: 'Collected Jobs', icon: FiDatabase },
  { href: '/applications', label: 'Applications', icon: FiBookmark },
  { href: '/history', label: 'History', icon: FiClock },
  { href: '/settings', label: 'Settings', icon: FiSettings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen fixed">
      <div className="p-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">JobX</h1>
        <NotificationBell />
      </div>
      <nav className="mt-6">
        {menuItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center px-6 py-3 text-sm font-medium ${
                isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}