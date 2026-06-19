"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaChartBar, FaTree, FaSeedling, FaHome } from "react-icons/fa";
import "./FarmNav.css";

export default function FarmNav() {
  const pathname = usePathname();

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: <FaHome /> },
    { path: "/farm-management", label: "Nông trại", icon: <FaSeedling /> },
    { path: "/crops", label: "Cây trồng", icon: <FaTree /> },
    { path: "/statistics", label: "Thống kê", icon: <FaChartBar /> },
  ];

  return (
    <nav className="farm-nav">
      <ul>
        {navItems.map((item) => (
          <li
            key={item.path}
            className={pathname === item.path ? "active" : ""}
          >
            <Link href={item.path} data-title={item.label}>
              <span className="icon">{item.icon}</span>
              <span className="nav-text" data-full={item.label}>
                {item.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}