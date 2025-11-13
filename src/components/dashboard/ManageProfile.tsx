"use client"

import React, { useState } from "react"
import Input from "@/components/form/input/InputField"
import Label from "@/components/form/Label"
import Button from "@/components/ui/button/Button"
import Alert from "@/components/ui/alert/Alert"
import { createClient } from "@/utils/supabase/client"
import UserMetaCard from "@/components/user-profile/UserMetaCard"
import UserInfoCard from "@/components/user-profile/UserInfoCard"
import UserAddressCard from "@/components/user-profile/UserAddressCard"
import { EyeIcon, EyeCloseIcon } from "@/icons" // ✅ assuming you already have these

export default function ManageProfile({ user, profile }: any) {
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile")
  const [email, setEmail] = useState(user?.email || "")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [alert, setAlert] = useState<{ type: string; message: string } | null>(
    null
  )
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleUpdateEmail = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)
  setAlert(null)

  try {
    // 1️⃣ Update email in Supabase Auth
    const { error: authError } = await supabase.auth.updateUser({ email })

    if (authError) {
      throw authError
    }

    // 2️⃣ Update email in your teachers table
    const { error: teacherError } = await supabase
      .from("teachers")
      .update({ email })
      .eq("account_id", user.id)

    if (teacherError) {
      console.error("Error updating teacher email:", teacherError)
      throw teacherError
    }

    // 3️⃣ Success message
    setAlert({ type: "success", message: "Email updated successfully." })
  } catch (err: any) {
    setAlert({ type: "error", message: err.message || "Failed to update email." })
  } finally {
    setLoading(false)
  }
}


  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setAlert(null)

    if (newPassword !== confirmPassword) {
      setAlert({ type: "error", message: "Passwords do not match." })
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setAlert({ type: "error", message: error.message })
    } else {
      setAlert({ type: "success", message: "Password updated successfully." })
      setNewPassword("")
      setConfirmPassword("")
    }

    setLoading(false)
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-8 border-b border-gray-200 dark:border-gray-800 mb-6">
        <button
          onClick={() => {
            setActiveTab("profile")
            setAlert(null)
          }}
          className={`pb-2 px-8 font-medium ${
            activeTab === "profile"
              ? "border-b-2 border-brand-500 text-brand-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Profile
        </button>
        <button
          onClick={() => {
            setActiveTab("security")
            setAlert(null)
          }}
          className={`pb-2 px-8 font-medium ${
            activeTab === "security"
              ? "border-b-2 border-brand-500 text-brand-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Security
        </button>
      </div>

      {/* Alert */}
      {alert && (
        <div className="mb-4">
          <Alert
            variant={alert.type === "error" ? "error" : "success"}
            title={alert.type === "error" ? "Error" : "Success"}
            message={alert.message}
          />
        </div>
      )}

      {/* Tabs Content */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          <UserMetaCard profile={profile} />
          <UserInfoCard profile={profile} />
          <UserAddressCard profile={profile} />
        </div>
      )}

      {activeTab === "security" && (
        <div className="space-y-10">
          {/* Update Email Section */}
          <div>
            <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:py-6 px-10">
              <h3 className="text-lg font-semibold mb-4">Update Email</h3>
              <form onSubmit={handleUpdateEmail} className="space-y-4 max-w-sm">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? "Updating..." : "Update Email"}
                </Button>
              </form>
            </div>
          </div>

          {/* Update Password Section */}
          <div>
            <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:py-6 px-10">
              <h3 className="text-lg font-semibold mb-4">Change Password</h3>
              <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-sm">
                <div>
                  <Label>New Password</Label>
                  <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <span
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showNewPassword ? (
                      <EyeCloseIcon className="w-4 h-4 fill-gray-500" />
                    ) : (
                      <EyeIcon className="w-4 h-4 fill-gray-500" />
                    )}
                  </span>
                  </div>
                </div>

                <div>
                  <Label>Confirm Password</Label>
                  <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <span
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showConfirmPassword ? (
                      <EyeCloseIcon className="w-4 h-4 fill-gray-500" />
                    ) : (
                      <EyeIcon className="w-4 h-4 fill-gray-500" />
                    )}
                  </span>
                  </div>
                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
