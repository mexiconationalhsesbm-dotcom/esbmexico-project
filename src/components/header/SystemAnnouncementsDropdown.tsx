  "use client";
  import Image from "next/image";
  import { useRouter } from "next/navigation";
  import React, { useEffect, useState } from "react";
  import { Dropdown } from "../ui/dropdown/Dropdown";
  import { DropdownItem } from "../ui/dropdown/DropdownItem";
  import { BellIcon } from "lucide-react";

  interface Announcement {
    id: number;
    title: string;
    content: string;
    visibility: string;
    created_at: string;
  }

  export default function SystemAnnouncementsHeader() {
    const [isOpen, setIsOpen] = useState(false);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);
    const [notifying, setNotifying] = useState(true); // ✅ Like tasks dropdown
    const router = useRouter();

    const toggleDropdown = () => setIsOpen(!isOpen);
    const closeDropdown = () => setIsOpen(false);

    // ✅ Same toggle behavior as tasks dropdown
    const handleClick = () => {
      toggleDropdown();
      setNotifying(false);
    };

    useEffect(() => {
      fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
      try {
        const response = await fetch("/api/announcements/list");
        if (!response.ok) throw new Error("Failed to fetch announcements");
        const data = await response.json();
        setAnnouncements(data.announcements || []);
      } catch (error) {
        console.error("Error fetching announcements:", error);
      } finally {
        setLoading(false);
      }
    };

    const handleDismiss = async (announcementId: number) => {
      try {
        await fetch("/api/announcements/dismiss", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ announcementId }),
        });
        setDismissedIds((prev) => new Set([...prev, announcementId]));
      } catch (error) {
        console.error("Error dismissing announcement:", error);
      }
    };

    const visibleAnnouncements = announcements.filter((a) => !dismissedIds.has(a.id));

    return (
      <div className="relative">
        <button
          onClick={handleClick}
          className="relative dropdown-toggle flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        >
          {visibleAnnouncements.length > 0 && (
            <span className="absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 flex">
              <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
            </span>
          )}
          <BellIcon className="w-5 h-5" />
        </button>

        <Dropdown
          isOpen={isOpen}
          onClose={closeDropdown}
          className="absolute -right-[240px] mt-[17px] flex h-fit max-h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
        >
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
            <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Announcements</h5>
            <button
              onClick={toggleDropdown}
              className="text-gray-500 transition dropdown-toggle dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-10 text-gray-500 dark:text-gray-400">Loading...</div>
          ) : visibleAnnouncements.length === 0 ? (
            <div className="flex justify-center py-10 text-gray-500 dark:text-gray-400">No Announcements</div>
          ) : (
            <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
              {visibleAnnouncements.map((announcement) => (
                <li key={announcement.id}>
                  <DropdownItem
                    className="flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5 transition"
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                      <BellIcon className="w-4 h-4 text-orange-700 dark:text-orange-300" />
                    </div>

                    {/* Content */}
                    <div className="flex flex-col w-full">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                        {announcement.title}
                      </p>

                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug line-clamp-3">
                        {announcement.content}
                      </p>

                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                       <span>
                          {new Date(announcement.created_at).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>


                        {/* Dismiss Button */}
                        {/* <button
                          onClick={() => handleDismiss(announcement.id)}
                          className="text-[11px] underline hover:text-red-500 dark:hover:text-red-400 ml-auto"
                        >
                          Dismiss
                        </button> */}
                      </div>
                    </div>
                  </DropdownItem>
                </li>
              ))}
            </ul>

          )}
        </Dropdown>
      </div>
    );
  }
