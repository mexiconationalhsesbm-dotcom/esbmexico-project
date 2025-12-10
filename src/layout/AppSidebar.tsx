"use client";
import React, { useEffect, useRef, useState,useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
// import { useAuth } from "@/context/auth-context"
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import {
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PieChartIcon,
  TaskIcon,
  TrashBinIcon,
  UserCircleIcon,
} from "../icons/index";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Archive, ArchiveIcon, Edit2Icon, Logs } from "lucide-react";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string}[];
};

type AppSidebarProps = {
  user: User;
};


interface User {
  id: string;
  name: string;
  role: string;
}


const AppSidebar = ({ user }: { user: any }) => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const supabase = createClientComponentClient();

  const [sbmItem, setSbmItem] = useState<NavItem[]>([]);
  const isMasterAdmin = user?.role?.role === "Master Admin"
  const isOFP = user?.role?.role === "Overall Focal Person"
  const isDimensionLeader = user?.role?.role === "Dimension Leader"

const navItems: NavItem[] = useMemo(() => [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/dashboard",
  },
  ...(isMasterAdmin
    ? [
        {
          name: "Personnel Management",
          icon: <ListIcon />,
          subItems: [
            { name: "Teachers List", path: "/dashboard/teachers" },
            { name: "Create Account", path: "/dashboard/create-admin" },
            { name: "Accounts List", path: "/dashboard/accounts-list" },
            { name: "Accounts Role", path: "/dashboard/accounts-role" },
            { name: "Manage Admins", path: "/dashboard/manage-admin" },
          ],
        },
      ]
    : []),
  ...(isMasterAdmin
    ? [
        {
          icon: <GridIcon />,
          name: "Manage Dimensions",
          path: "/dashboard/manage-dimension",
        },
      ]
    : []),
  ...(isMasterAdmin
    ? [
        {
          icon: <GridIcon />,
          name: "Manage Announcements",
          path: "/dashboard/manage-announcements",
        },
      ]
    : []),
  ...(isDimensionLeader
    ? [
        {
          icon: <Edit2Icon />,
          name: "Revisions Requests",
          path: "/dashboard/revisions",
        },
      ]
    : []),
    ...(isMasterAdmin || isDimensionLeader
    ? [
      {
        icon: <TaskIcon />,
        name: "Tasks",
        path: "/dashboard/task",
      },
      ]
    : []),

    
], [isMasterAdmin, isDimensionLeader]);

const settingsItems: NavItem[] = [
  {
    icon: <TrashBinIcon />,
    name: "Recently Deleted",
    path: "/dashboard/trash",
  },
  {
    icon: <GridIcon />,
    name: "Account Settings",
    path: "/dashboard/manage-profile",
  },

];

const analyticsItems: NavItem[] = [
  ...(isMasterAdmin || isOFP
    ? [
        {
          icon: <GridIcon />,
           name: "System Logs",
          path: "/dashboard/system-logs",
        },
      ]
    : []),

];

const archiveItems: NavItem[] = [
    ...(isMasterAdmin || isOFP
    ? [
          {
            icon: <Archive />,
            name: "Archiving",
            path: "/dashboard/archiving",
          },
            {
            icon: <ArchiveIcon />,
            name: "Archived",
            path: "/dashboard/archived",
          },
      ]
    : []),

];


// useEffect(() => {
//     const fetchSbmItems = async () => {
//       const { data, error } = await supabase
//         .from("dimensions")
//         .select("id, name, slug");

//       if (error) {
//         console.error("Error fetching SBM items:", error);
//         return;
//       }

//       const mappedItems: NavItem[] = data.map((item) => ({
//         name: item.name,
//         path: `/dashboard/${item.slug}`,
//         icon: <PieChartIcon />, 
//       }));


//         mappedItems.unshift({
//           name: "All Documents",
//           path: "/dashboard/all-documents",
//           icon: <UserCircleIcon />,
//         });

//       // if (!isMasterAdmin && !isOFP) {
//         mappedItems.push({
//           name: "Shared Documents",
//           path: "/dashboard/shared",
//           icon: <UserCircleIcon />,
//         });
//       // }

//       setSbmItem(mappedItems);
//     };

//     fetchSbmItems();
//   }, [supabase, isMasterAdmin, isOFP]);

useEffect(() => {
  const fetchSbmItems = async () => {
    try {
      // Explicitly type the array to avoid implicit any[]
      let dimensionsData: { id: string; name: string; slug: string }[] = [];

      if (isMasterAdmin || isOFP) {
        // 🟢 Master Admins and OFPs see all dimensions
        const { data, error } = await supabase
          .from("dimensions")
          .select("id, name, slug");

        if (error) throw error;
        dimensionsData = data || [];
      } else {
        // 🟠 Regular user: fetch their assigned dimension
        const { data: adminData, error: adminError } = await supabase
          .from("admins")
          .select("assigned_dimension_id")
          .eq("id", user.id)
          .single();

        if (adminError) throw adminError;

        if (adminData?.assigned_dimension_id) {
          const { data: dimension, error: dimensionError } = await supabase
            .from("dimensions")
            .select("id, name, slug")
            .eq("id", adminData.assigned_dimension_id)
            .single();

          if (dimensionError) throw dimensionError;

          if (dimension) dimensionsData = [dimension];
        }
      }

      // 🗂️ Map to sidebar items
      const mappedItems: NavItem[] = dimensionsData.map((item) => ({
        name: item.name,
        path: `/dashboard/${item.slug}`,
        icon: <PieChartIcon />,
      }));

        mappedItems.unshift({
          name: "All Documents",
          path: "/dashboard/all-documents",
          icon: <UserCircleIcon />,
        });

      mappedItems.push({
        name: "Shared Documents",
        path: "/dashboard/shared",
        icon: <UserCircleIcon />,
      });

      setSbmItem(mappedItems);
    } catch (error) {
      console.error("Error fetching SBM items:", error);
    }
  };

  fetchSbmItems();
}, [supabase, user.id, isMasterAdmin, isOFP]);



  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "menu" | "sbm" | "settings" | "analytics" | "archive"
  ) => (
    <ul className="flex flex-col gap-4">
      {navItems.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group  ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={` ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className={`menu-item-text`}>{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200  ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className={`menu-item-text`}>{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "menu" | "sbm" | "settings" | "analytics" | "archive" ;
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => path === pathname;
   const isActive = useCallback((path: string) => path === pathname, [pathname]);

  useEffect(() => {
    // Check if the current path matches any submenu item
    let submenuMatched = false;
    ["menu", "sbm", "settings", "analytics"].forEach((menuType) => {
      const items = menuType === "menu" ? navItems : sbmItem;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "menu" | "sbm" | "settings" | "analytics" | "archive",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    // If no submenu item matches, close the open submenu
    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname,isActive, navItems, sbmItem]);

  useEffect(() => {
    // Set the height of the submenu items when the submenu is opened
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
    console.log(HorizontaLDots); // should log a function, NOT an object
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "menu" | "sbm" | "settings" | "analytics" | "archive") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-5 flex  ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <Image
                className="dark:hidden"
                src="/images/logo/sbmlogo-light.svg"
                alt="Logo"
                width={170}
                height={50}
              />
              <Image
                className="hidden dark:block"
                src="/images/logo/sbmlogo-dark.svg"
                alt="Logo"
                width={170}
                height={50}
              />
            </>
          ) : (
            <Image
              src="/images/logo/logo.png"
              alt="Logo"
              width={40}
              height={40}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-sm font-bold uppercase flex leading-5 text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(navItems, "menu")}
            </div>

            <div>
              <h2
                className={`mb-4 text-sm font-bold uppercase flex leading-5 text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "SBM Documents"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(sbmItem, "sbm")}
            </div>

            {analyticsItems.length > 0 && (
              <div>
                <h2
                  className={`mb-4 text-sm font-bold uppercase flex leading-5 text-gray-400 ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    "Analytics"
                  ) : (
                    <HorizontaLDots />
                  )}
                </h2>
                {renderMenuItems(analyticsItems, "analytics")}
              </div>
            )}

            {archiveItems.length > 0 && (
            <div>
              <h2
                className={`mb-4 text-sm font-bold uppercase flex leading-5 text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Archive"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(archiveItems, "archive")}
            </div>
            )}

            <div>
              <h2
                className={`mb-4 text-sm font-bold uppercase flex leading-5 text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Settings"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(settingsItems, "settings")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
