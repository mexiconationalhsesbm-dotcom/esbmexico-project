  "use client";

  import React, { useEffect, useMemo, useState } from "react";
  import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
  } from "../ui/table";
  import { ArrowUpDown, Loader2, Plus } from "lucide-react";
  import Button from "../ui/button/Button";
  import { SortPanel, type SortOptions } from "../dashboard/sort-panel";
  import Pagination from "@/components/tables/Pagination";
  import { useAlert } from "@/context/AlertContext";
  import { createClient } from "@/utils/supabase/client";
  import AddTeacherModal from "../modals/AddTeacherModal";
  import EditTeacherModal from "../modals/EditTeacherModal";
  import DeleteTeacherModal from "../modals/DeleteTeacherModal";
  import Image from "next/image";


  type Teacher = {
    id: string;
    firstname: string;
    middlename: string;
    lastname: string;
    fullname: string;
    email: string;
    teacher_id: string | null;
    account_id: string | null;
    profile_url: string | null;
  };

  export default function TeachersTable({ data }: { data: Teacher[] }) {
    const { showAlert } = useAlert();
    const supabase = createClient();
    const [teachersList, setTeachersList] = useState<Teacher[]>(data);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortOptions, setSortOptions] = useState<SortOptions>({
      field: "name",
      order: "asc",
    });
    const [isSortOpen, setIsSortOpen] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
      setCurrentPage(1);
    }, [searchQuery, sortOptions]);

    useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) setCurrentUser(data.user);

      // ✅ Done loading initial data
      setIsLoading(false);
    };

    fetchUser();
  }, [supabase]);


    const logSystemActivity = async ({
      userId,
      action,
      entityType,
      status,
      description
    }: {
      userId: string;
      action: string;
      entityType: string;
      status: string;
      description: string;
    }) => {
      try {
        const { error } = await supabase.from("system_logs").insert([
          {
            account_id: userId,
            action,
            entity_type: entityType,
            status,
            description,
          },
        ]);

        if (error) throw error;
      } catch (err) {
        console.error("System log insert error:", err);
      }
    };


    // 🔍 Filter by name
    const filteredTeachers = useMemo(() => {
      return teachersList.filter((teacher) => {
        const fullname = teacher.firstname + " " + teacher.middlename + " " + teacher.lastname
        const q = searchQuery.toLowerCase();
        return (
          fullname.toLowerCase().includes(q)
        );
      });
    }, [teachersList, searchQuery]);

    // 🔽 Sorting
    const sortedTeachers = useMemo(() => {
      const list = [...filteredTeachers];
      
      switch (sortOptions.field) {
        case "name":
          list.sort((a, b) => a.fullname.localeCompare(b.fullname));
          break;
      }
      if (sortOptions.order === "desc") list.reverse();
      return list;
    }, [filteredTeachers, sortOptions]);

    const totalPages = Math.ceil(sortedTeachers.length / itemsPerPage);

    // 📄 Pagination
    const paginatedTeachers = useMemo(() => {
      const start = (currentPage - 1) * itemsPerPage;
      return sortedTeachers.slice(start, start + itemsPerPage);
    }, [sortedTeachers, currentPage]);


    const handleAddTeachers = async (newTeachers: any[]) => {
    try {
      const formattedTeachers = newTeachers.map((t) => ({
        firstname: t.firstname,
        middlename: t.middlename,
        lastname: t.lastname,
        fullname: t.fullname,
        email: t.email,
        teacher_id: t.teacher_id,
      }));

      const { data, error } = await supabase
        .from("teachers")
        .insert(formattedTeachers)
        .select();

      if (error) throw error;

      // Optional: update local list
      setTeachersList((prev) => [...prev, ...data]);
      await logSystemActivity({
        userId: currentUser?.id,
        action: "ADD_TEACHER",
        entityType: "teacher",
        status: "success",
        description: `User added ${formattedTeachers.length} teacher(s) in the teachers table.`,
      });

      showAlert({
        type: "success",
        title: "Success!",
        message: `${formattedTeachers.length} teacher(s) added successfully`,
      });
    } catch (err: any) {
      showAlert({
        type: "error",
        title: "Failed",
        message: err.message,
      });
    }
  };


  // ✏️ Edit Teacher
  const handleEditTeacher = async (updatedTeacher: any) => {
    try {
      const fullname = `${updatedTeacher.first_name} ${
        updatedTeacher.middle_name ? updatedTeacher.middle_name + " " : ""
      }${updatedTeacher.last_name}`.trim();

      const { data, error } = await supabase
        .from("teachers")
        .update({
          firstname: updatedTeacher.first_name,
          middlename: updatedTeacher.middle_name,
          lastname: updatedTeacher.last_name,
          fullname: fullname,
          email: updatedTeacher.email,
          teacher_id: updatedTeacher.teacher_id,
        })
        .eq("id", updatedTeacher.id)
        .select()
        .single();

      if (error) throw error;

      // Update state
      setTeachersList((prev) =>
        prev.map((t) => (t.id === data.id ? { ...t, ...data } : t))
      );
      await logSystemActivity({
        userId: currentUser?.id,
        action: "EDIT_TEACHER",
        entityType: "teacher",
        status: "success",
        description: `Edited teacher: ${fullname}`,
      });

      showAlert({
        type: "success",
        title: "Success",
        message: "Teacher data updated successfully",
      });
    } catch (err: any) {
      showAlert({
        type: "error",
        title: "Error",
        message: err.message,
      });
      console.error(err)
      console.log(updatedTeacher)
    }
  };

      const handleDeleteTeacher = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
          const { error } = await supabase
            .from("teachers")
            .delete()
            .eq("id", deleteTarget.id);

          if (error) throw error;

          setTeachersList((prev) => prev.filter((t) => t.id !== deleteTarget.id));
          await logSystemActivity({
            userId: currentUser?.id,
            action: "DELETE_TEACHER",
            entityType: "teacher",
            status: "success",
            description: `Deleted teacher: ${deleteTarget.fullname}`,
          });
          showAlert({
            type: "success",
            title: "Deleted!",
            message: `${deleteTarget.fullname} has been removed.`,
          });
          setIsDeleteModalOpen(false);
          setDeleteTarget(null);
        } catch (err: any) {
          showAlert({
            type: "error",
            title: "Error",
            message: err.message,
          });
        } finally {
          setIsDeleting(false);
        }
      };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

    return (
      <div>
        {/* 🔍 Search + Sort Panel */}
        <div className="flex justify-end items-center">
          <div className="relative flex gap-4 mb-8 items-center">
            <div className="relative">
              <span className="absolute -translate-y-1/2 left-4 top-1/2 pointer-events-none">
                <svg
                  className="fill-gray-500 dark:fill-gray-400"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
                  />
                </svg>
              </span>
              <input
                type="search"
                placeholder="Search teachers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-white dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[430px]"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setIsSortOpen(true)}
              className="flex items-center gap-1"
            >
              <ArrowUpDown className="h-4 w-4 mr-1" />
              Sort
            </Button>
          </div>

          <SortPanel
            title="Sort Teachers"
            isOpen={isSortOpen}
            onClose={() => setIsSortOpen(false)}
            options={sortOptions}
            onSort={setSortOptions}
            availableFields={["name"]}
          />
        </div>

        <div className="flex justify-end items-center mb-6">
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Add Teacher
            </Button>
        </div>

        {/* 🧾 Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
          <div className="max-w-full overflow-x-auto">
            <div className="min-w-[800px]">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/5">
                  <TableRow>
                    <TableCell className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Teacher
                    </TableCell>
                    <TableCell className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Employee ID
                    </TableCell>
                    <TableCell className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Account
                    </TableCell>
                    <TableCell className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-white/[5">
                  {paginatedTeachers.length > 0 ? (
                    paginatedTeachers.map((teacher) => (
                      <TableRow key={teacher.id}>
                        <TableCell className="px-5 py-4 sm:px-6 text-start">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 flex items-center">
                              <Image
                                src={teacher.profile_url || "/images/icons/admin_profile.svg"}
                                alt={`${teacher.fullname}'s profile`}
                                width={30}
                                height={30}
                                className="w-[30px] h-[30px] rounded-full object-cover border border-gray-200 dark:border-gray-700"
                                onError={(e) => (e.currentTarget.src = "/images/icons/admin_profile.svg")}
                              />
                            </div>
                            <div>
                              <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                {teacher.fullname}
                              </span>
                              <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                                {teacher.email}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-gray-600 dark:text-gray-400">
                          {teacher.teacher_id || "N/A"}
                        </TableCell>
                          <TableCell className="px-5 py-4 text-start">
                          <div>
                            {teacher.account_id ? (
                              <span className="inline-block px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full dark:bg-green-900 dark:text-green-200">
                                Registered
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded-full dark:bg-gray-800 dark:text-gray-300">
                                No Account
                              </span>
                            )}
                            <span className="block mt-1 text-gray-500 text-theme-xs dark:text-gray-400">
                              {teacher.account_id ? teacher.account_id : "-"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          <div className="flex flex-row justify-center items-center gap-4">
                            <button
                            onClick={() => {
                              setSelectedTeacher(teacher);
                              setIsEditModalOpen(true);
                            }}
                            className="bg-blue-600 px-4 py-1 rounded-xl">
                              <span className="text-warning-25 text-xs">Edit</span>
                            </button>
                            <button
                            onClick={() => {
                              setDeleteTarget(teacher);
                              setIsDeleteModalOpen(true);
                            }}
                            className="bg-red-700 px-4 py-1 rounded-xl">
                              <span className="text-warning-25 text-xs">Delete</span>
                            </button>
                          </div>
                        </TableCell>

                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 text-gray-500">
                        No teachers found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* 📄 Pagination */}
        <div className="mt-8 flex justify-center items-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>

        {/* Modals */}
        <AddTeacherModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddTeachers}
        />
        <EditTeacherModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          teacher={selectedTeacher}
          onSave={handleEditTeacher}
        />

        <DeleteTeacherModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteTeacher}
          isLoading={isDeleting}
        />


      </div>
    );
  }
