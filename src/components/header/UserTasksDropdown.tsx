"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { TaskIcon } from "@/icons";
import ReviewTaskModal from "../modals/ReviewTaskModal";

// 🕒 Helper function to display “time ago”
function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // in seconds
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min${diff < 120 ? "" : "s"} ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr${diff < 7200 ? "" : "s"} ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} day${diff < 172800 ? "" : "s"} ago`;
  return date.toLocaleDateString();
}

export default function UserTasksDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifying, setNotifying] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
    const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const toggleDropdown = () => setIsOpen((prev) => !prev);
  const closeDropdown = () => setIsOpen(false);
  const handleClick = () => {
    toggleDropdown();
    setNotifying(false);
  };

      const fetchTasks = async () => {
        try {
          const profileRes = await fetch("/api/admins/profile");
          const profile = await profileRes.json();
          console.log("🔹 Profile:", profile);

          // Access the nested admin object properly
          const roleId = profile?.admin?.role_id;

          let endpoint = "/api/tasks/user-tasks";
          let type = "assigned";

          if (roleId === 4) {
            endpoint = "/api/tasks/leader-tasks";
            type = "review";
          }

          console.log("📡 Fetching from:", endpoint);

          const res = await fetch(endpoint);
          const data = await res.json();

          if (res.ok && data.tasks) {
            const taggedTasks = data.tasks.map((t: any) => ({ ...t, type }));
            setTasks(taggedTasks);
          }
        } catch (err) {
          console.error("❌ Error fetching user tasks:", err);
        } finally {
          setLoading(false);
        }
      };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleReviewed = () => {
    fetchTasks(); // ✅ refresh after modal action
  };

  return (
    <div className="relative">
      <button
        className="relative dropdown-toggle flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleClick}
      >
        {tasks.length > 0 && (
          <span className="absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 flex">
            <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
          </span>
        )}
        <TaskIcon className="fill-current w-5 h-5" />
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-60 mt-[17px] flex h-fit max-h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">My Tasks</h5>
          <button
            onClick={toggleDropdown}
            className="text-gray-500 transition dropdown-toggle dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10 text-gray-500 dark:text-gray-400">Loading...</div>
        ) : tasks.length === 0 ? (
          <div className="flex justify-center py-10 text-gray-500 dark:text-gray-400">No tasks assigned</div>
        ) : (
          <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
            {tasks.map((task) => (
              <li key={task.id}>
                <DropdownItem
                  onItemClick={() => {
                  closeDropdown();
                  if (task.type === "review") {
                    // ✅ open modal for review tasks
                    setSelectedTask(task);
                    setIsReviewModalOpen(true);
                  } else {
                    // 🟢 regular assigned task → navigate
                    const folderId = task.folder?.parent_folder_id || "";
                    router.push(`/dashboard/${task.dimension?.slug || ""}/${folderId}`);
                  }
                }}
                  className="flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5"
                >
                  <div className="relative shrink-0 w-10 h-10 rounded-full overflow-hidden">
                    <Image
                      width={20}
                      height={20}
                      src={
                        task.type === "review"
                          ? task.submitted_by_admin?.profile_url || "/images/user/default-avatar.png"
                          : task.created_by?.profile_url || "/images/user/default-avatar.png"
                      }
                      alt={
                        task.type === "review"
                          ? task.submitted_by_admin?.fullname || "User"
                          : task.created_by?.fullname || "User"
                      }
                      className="w-full overflow-hidden rounded-full object-cover"
                    />
                  </div>

                  <span className="block">
                    {task.type === "review" ? (
                      // 🟠 Leader’s review task
                      <span className="mb-1.5 space-x-1 block text-theme-sm text-gray-500 dark:text-gray-400">
                        <span className="font-medium text-gray-800 dark:text-white/90">
                          {task.submitted_by_admin?.full_name || "A member"}
                        </span>
                        <span>submitted task:</span>
                        <span className="font-medium text-gray-800 dark:text-white/90">
                          {task.task_title}
                        </span>
                        <span>for your review.</span>
                      </span>
                    ) : (
                      // 🟢 Member’s assigned task
                      <span className="mb-1.5 space-x-1 block text-theme-sm text-gray-500 dark:text-gray-400">
                        <span className="font-medium text-gray-800 dark:text-white/90">
                          {task.created_by?.fullname || "Unknown User"}
                        </span>
                        <span>assigned you task:</span>
                        <span className="font-medium text-gray-800 dark:text-white/90">
                          {task.title}
                        </span>
                        <span>for folder</span>
                        <span className="font-medium text-gray-800 dark:text-white/90">
                          {task.folder?.name || "Untitled Folder"}
                        </span>
                      </span>
                    )}

                    <span className="flex items-center gap-2 text-gray-500 text-theme-xs dark:text-gray-400">
                      <span>{task.status.charAt(0).toUpperCase() + task.status.slice(1)}</span>
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      <span>{timeAgo(task.created_at)}</span>
                    </span>
                  </span>
                </DropdownItem>
              </li>
            ))}
          </ul>
        )}

        <div className="p-3 border-t border-gray-100 dark:border-gray-800">
          <Link
            href={`/dashboard/${tasks[0]?.dimension?.slug || ""}`}
            className="block px-4 py-2 mt-3 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            View All Folders
          </Link>
        </div>
      </Dropdown>

      <ReviewTaskModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        task={selectedTask}
        onReviewed={handleReviewed}
      />
    </div>
  );
}
