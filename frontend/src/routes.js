import React from "react";

// Admin Imports
import Profile from "views/admin/profile";
import DataTables from "views/admin/tables";

// Game Parlour Imports
import GameParlourDashboard from "views/admin/gameparlour";
import TablesManagement from "views/admin/tables-management";
import SessionsManagement from "views/admin/sessions";
import UserInterface from "views/admin/user-interface";
import OrganizationManagement from "views/admin/organization-management";

// Auth Imports
import SignIn from "views/auth/SignIn";

// Icon Imports
import {
  MdBarChart,
  MdPerson,
  MdLock,
  MdGames,
  MdTableChart,
  MdAccessTime,
  MdQrCodeScanner,
  MdBusiness,
} from "react-icons/md";

const routes = [
  {
    name: "Game Parlour Dashboard",
    layout: "/admin",
    path: "default",
    icon: <MdGames className="h-6 w-6" />,
    component: <GameParlourDashboard />,
  },
  {
    name: "Organizations",
    layout: "/admin",
    path: "organizations",
    icon: <MdBusiness className="h-6 w-6" />,
    component: <OrganizationManagement />,
    superAdminOnly: true, // Custom property to identify super admin routes
  },
  {
    name: "Tables Management",
    layout: "/admin",
    path: "tables-management",
    icon: <MdTableChart className="h-6 w-6" />,
    component: <TablesManagement />,
  },
  {
    name: "Gaming Sessions",
    layout: "/admin",
    path: "sessions",
    icon: <MdAccessTime className="h-6 w-6" />,
    component: <SessionsManagement />,
  },
  {
    name: "User Interface",
    layout: "/admin",
    path: "user-interface",
    icon: <MdQrCodeScanner className="h-6 w-6" />,
    component: <UserInterface />,
    secondary: true,
  },
  {
    name: "Data Tables",
    layout: "/admin",
    icon: <MdBarChart className="h-6 w-6" />,
    path: "data-tables",
    component: <DataTables />,
  },
  {
    name: "Profile",
    layout: "/admin",
    path: "profile",
    icon: <MdPerson className="h-6 w-6" />,
    component: <Profile />,
  },
  {
    name: "Sign In",
    layout: "/auth",
    path: "sign-in",
    icon: <MdLock className="h-6 w-6" />,
    component: <SignIn />,
  },
];
export default routes;
