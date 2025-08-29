import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, Ticket, ShieldCheck, IndentDecreaseIcon, ArrowBigUp, BarChart } from "lucide-react";

const Sidebar = ({ role }) => {
  const commonLinks = [
    { to: "/dashboard", icon: <BarChart size={20} />, label: "Dashboard" },
  ];

  // Role-specific links
  const adminLinks = [
    { to: "/supports", icon: <ShieldCheck size={20} />, label: "Supports" },
    { to: "/customers", icon: <Users size={20} />, label: "Customers" },
    { to: "/tickets", icon: <Ticket size={20} />, label: "Tickets" },
  ];

  const customerLinks = [
    { to: "/tickets", icon: <Ticket size={20} />, label: "My Tickets" },
  ];

  const supportLinks = [
    { to: "/tickets", icon: <Ticket size={20} />, label: "Assigned Tickets" },
  ];

  const roleLinks =
    role === "admin"
      ? adminLinks
      : role === "support"
      ? supportLinks
      : customerLinks;

  const allLinks = [...commonLinks, ...roleLinks];

  return (
    <aside className="h-screen w-64 bg-white border-r shadow-sm p-4 space-y-4">
      <h2 className="text-2xl font-bold text-blue-600 mb-6">
        {role === "admin" ? "Admin Panel" : role === "support" ? "Support Panel" : "Customer Panel"}
      </h2>
      <nav className="flex flex-col space-y-2">
        {allLinks.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2 rounded-lg transition ${
                isActive
                  ? "bg-blue-100 text-blue-700 font-semibold"
                  : "text-gray-700 hover:bg-gray-100"
              }`
            }
          >

            {icon}
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
