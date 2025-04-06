import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Package,
  ClipboardList,
  MessageSquare,
  Settings,
  ArrowLeft
} from "lucide-react";

export function AdminSidebar() {
  const location = useLocation();

  const menuItems = [
    {
      path: "/admin/dashboard",
      icon: <LayoutDashboard className="w-5 h-5 mr-2" />,
      label: "Dashboard"
    },
    {
      path: "/admin/users",
      icon: <Users className="w-5 h-5 mr-2" />,
      label: "Pengguna"
    },
    {
      path: "/admin/plans",
      icon: <Package className="w-5 h-5 mr-2" />,
      label: "Paket"
    },
    {
      path: "/admin/audit-logs",
      icon: <ClipboardList className="w-5 h-5 mr-2" />,
      label: "Audit Log"
    },
    // {
    //   path: "/admin/messages",
    //   icon: <MessageSquare className="w-5 h-5 mr-2" />,
    //   label: "Pesan"
    // },
    // {
    //   path: "/admin/settings",
    //   icon: <Settings className="w-5 h-5 mr-2" />,
    //   label: "Pengaturan"
    // }
    {
      path: "/dashboard",
      icon: <ArrowLeft className="w-5 h-5 mr-2" />,
      label: "Back to Dashboard"
    }
  ];

  return (
    <div className="w-64 min-h-[calc(100vh-3.5rem)] bg-white border-r">
      <div className="p-4">
        <h2 className="text-xl font-bold text-gray-800">Admin Panel</h2>
      </div>
      <nav className="mt-4">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 ${
              location.pathname === item.path ? "bg-gray-100 font-medium" : ""
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
} 