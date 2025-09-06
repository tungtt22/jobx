"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/profile", label: "Personal Information" },
  { href: "/profile/resume", label: "Resume" },
  { href: "/profile/settings", label: "Settings" },
];

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col md:flex-row gap-6 min-h-screen bg-gray-100">
      <aside className="w-full md:w-64 bg-white border-r min-h-screen py-6 px-4">
        <nav className="space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded-md transition-colors ${
                  isActive
                    ? "bg-gray-200 text-gray-900 font-semibold"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex-1 p-8">
        <div className="bg-white shadow rounded-lg p-6">{children}</div>
      </div>
    </div>
  );
}
