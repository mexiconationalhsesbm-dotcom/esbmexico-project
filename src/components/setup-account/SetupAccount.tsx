"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/libs/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { useAuth } from "@/context/auth-context"

interface SetupPasswordPageProps {
  user: {
    id: string
    email?: string | null // ✅ accepts undefined
  }
  admin: {
    assigned_dimension_id: string
  }
}


export default function SetupPasswordPage({ user, admin }: SetupPasswordPageProps) {
  const router = useRouter()
  const { updatePassword } = useAuth()

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) return "Password must be at least 8 characters long"
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter"
    if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter"
    if (!/[0-9]/.test(password)) return "Password must contain at least one number"
    return null
  }

  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const passwordError = validatePassword(newPassword)
    if (passwordError) {
      setError(passwordError)
      setIsLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      // 1️⃣ Update password via context
      const { error: updateError } = await updatePassword(newPassword)
      if (updateError) throw updateError

      // 2️⃣ Update admin status → "active"
      const { error: statusError } = await supabase
        .from("admins")
        .update({ status: "active" })
        .eq("id", user.id)

      if (statusError) throw statusError

      // 3️⃣ Redirect
      router.replace("/dashboard")
    } catch (err: any) {
      console.error("Password setup failed:", err)
      setError(err.message || "Something went wrong while setting your password.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Set Up Your Password</CardTitle>
          <CardDescription>
            Welcome! Please create a new password for your account:{" "}
            <span className="font-medium">{user.email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetupPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="rounded-lg border bg-muted/50 p-3 text-sm">
              <p className="font-medium mb-2">Password Requirements:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3" /> At least 8 characters long
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3" /> One uppercase letter
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3" /> One lowercase letter
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3" /> One number
                </li>
              </ul>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Setting up..." : "Set Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
