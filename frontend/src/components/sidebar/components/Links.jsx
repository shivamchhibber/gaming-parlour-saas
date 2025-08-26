/* eslint-disable */
import React from "react";
import { Link, useLocation } from "react-router-dom";
import DashIcon from "components/icons/DashIcon";
import authService from "services/authService";
// chakra imports

export function SidebarLinks(props) {
  // Chakra color mode
  let location = useLocation();

  const { routes } = props;
  const currentUser = authService.getCurrentUser();

  // verifies if routeName is the one active (in browser input)
  const activeRoute = (routeName) => {
    return location.pathname.includes(routeName);
  };

  const createLinks = (routes) => {
    return routes
      .filter((route) => {
        // Filter routes based on user role
        if (route.superAdminOnly && currentUser?.role !== "super_admin") {
          return false; // Hide super admin routes for non-super admins
        }
        // Hide auth routes (like Sign In) when user is logged in
        if (route.layout === "/auth" && currentUser) {
          return false; // Hide auth routes when logged in
        }
        return true; // Show all other routes
      })
      .map((route, index) => {
        if (
          route.layout === "/admin" ||
          route.layout === "/auth" ||
          route.layout === "/rtl"
        ) {
          return (
            <Link key={index} to={route.layout + "/" + route.path}>
              <div className="relative mb-3 flex hover:cursor-pointer">
                <li
                  className="my-[3px] flex cursor-pointer items-center px-8"
                  key={index}
                >
                  <span
                    className={`${activeRoute(route.path) === true
                      ? "font-bold text-brand-500 dark:text-white"
                      : "font-medium text-gray-600"
                      }`}
                  >
                    {route.icon ? route.icon : <DashIcon />}{" "}
                  </span>
                  <p
                    className={`leading-1 ml-4 flex ${activeRoute(route.path) === true
                      ? "font-bold text-navy-700 dark:text-white"
                      : "font-medium text-gray-600"
                      }`}
                  >
                    {route.name}
                  </p>
                </li>
                {activeRoute(route.path) ? (
                  <div class="absolute right-0 top-px h-9 w-1 rounded-lg bg-brand-500 dark:bg-brand-400" />
                ) : null}
              </div>
            </Link>
          );
        }
      });
  };
  // BRAND
  return createLinks(routes);
}

export default SidebarLinks;
