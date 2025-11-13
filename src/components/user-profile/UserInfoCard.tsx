"use client";
import React, { useState, useEffect } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { useRouter } from "next/navigation";
import { useAlert } from "@/context/AlertContext";

interface UserInfoCardProps {
  profile: any;
}

export default function UserInfoCard({ profile }: UserInfoCardProps) {
  const { isOpen, openModal, closeModal } = useModal();
  const router = useRouter();
  const { showAlert } = useAlert();

  const [firstName, setFirstName] = useState<string>("");
  const [middleName, setMiddleName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [birthdate, setBirthdate] = useState<string>("");
  const [age, setAge] = useState<number | "">("");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setFirstName(profile?.firstname ?? "");
    setMiddleName(profile?.middlename ?? "");
    setLastName(profile?.lastname ?? "");
    setGender(profile?.gender ?? "");
    setBirthdate(profile?.birthdate ?? "");
    setAge(profile?.age ?? "");
    setErrorMessage(null);
  }, [profile, isOpen]);

  const handleSave = async () => {
    setErrorMessage(null);

    if (!firstName.trim()) {
      setErrorMessage("First name is required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        accountId: profile?.account_id ?? profile?.id,
        firstname: firstName,
        middlename: middleName,
        lastname: lastName,
        gender,
        birthdate,
        age: age === "" ? null : Number(age),
      };

      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        console.error("Update error:", json);
        setErrorMessage(json?.error || "Failed to update profile");
        setSaving(false);
        return;
      }

      closeModal();
      router.refresh();
    } catch (err: any) {
      console.error("Unexpected error updating profile:", err);
      setErrorMessage("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        {/* DISPLAY SECTION */}
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Personal Information
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                First Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profile?.firstname || "N/A"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Middle Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profile?.middlename || "N/A"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Last Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profile?.lastname || "N/A"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Email Address
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profile?.email || "N/A"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Gender
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profile?.gender || "N/A"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Birthdate
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profile?.birthdate || "N/A"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Age
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profile?.age ?? "N/A"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Assigned Dimension
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profile?.dimensions?.name || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* EDIT BUTTON */}
        <button
          onClick={openModal}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/3 dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
        >
          <svg
            className="fill-current"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z" />
          </svg>
          Edit
        </button>
      </div>

      {/* MODAL */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Personal Information
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your details to keep your profile up-to-date.
            </p>
          </div>

          {/* FORM */}
          <form
            className="flex flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div>
                  <Label>First Name</Label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    type="text"
                  />
                </div>

                <div>
                  <Label>Middle Name</Label>
                  <Input
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    type="text"
                  />
                </div>

                <div>
                  <Label>Last Name</Label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    type="text"
                  />
                </div>

                <div>
                  <Label>Gender</Label>
                  <Input
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    type="text"
                  />
                </div>

                <div>
                  <Label>Birthdate</Label>
                  <Input
                    value={birthdate}
                    onChange={(e) => setBirthdate(e.target.value)}
                    type="date"
                  />
                </div>

                <div>
                  <Label>Age</Label>
                  <Input
                    value={age?.toString() ?? ""}
                    onChange={(e) =>
                      setAge(e.target.value ? Number(e.target.value) : "")
                    }
                    type="number"
                  />
                </div>

                <div className="col-span-2">
                  <Label>Assigned Dimension (read-only)</Label>
                  <Input
                    type="text"
                    value={profile?.dimensions?.name ?? ""}
                    disabled
                  />
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="px-2 mt-3 text-sm text-destructive">
                {errorMessage}
              </div>
            )}

            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
