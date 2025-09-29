"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profile" },
];

const Navbar = () => {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path
      ? "border-blue-500 text-blue-600"
      : "border-transparent text-gray-600 hover:text-gray-900";
  };

  return (
    <nav className="bg-white shadow-sm w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/" className="flex items-center mr-8">
              <span className="text-xl font-bold text-blue-700">JobX.vn</span>
            </Link>
            <div className="hidden sm:flex sm:space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-150 ${isActive(
                    link.href
                  )}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden sm:flex sm:items-center">
            <Link
              href="/auth/login"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
