  "use client"

  import type React from "react"

  import { createContext, useContext, useEffect, useState } from "react"
  import { useRouter, usePathname } from "next/navigation"
  import type { Session, User } from "@supabase/supabase-js"
  import { supabase } from "@/libs/supabase"

export interface Admin {
  id: string
  email: string
  full_name: string | null
  role: { 
    id: number
    name: "Unassigned" | "Master Admin" | "Overall Focal Person" | "Dimension Leader" | "Dimension Member"
  } | null
  assigned_dimension_id: number | null
  status: "active" | "suspended" | "pending"
  last_active_at: string | null
  created_at: string
  updated_at: string
}



  type AuthContextType = {
    user: User | null
    admin: Admin | null
    session: Session | null
    rolesReady: boolean
    isLoading: boolean
    signIn: (email: string, password: string) => Promise<{ error: any }>
    signUp: (email: string, password: string, fullName: string) => Promise<{ error: any; data: any }>
    signOut: () => Promise<void>
    resetPassword: (email: string) => Promise<{ error: any }>
    updatePassword: (password: string) => Promise<{ error: any }>
    sendOTP: (email: string, userId: string) => Promise<{ error: any }>
    verifyOTP: (email: string, userId: string, otp: string) => Promise<{ error: any }>
    isMasterAdmin: boolean
    isOverallFocalPerson: boolean
    isDimensionLeader: boolean
    isDimensionMember: boolean
    canManageAdmins: boolean
    canAccessAllDimensions: boolean
    canDeleteItems: boolean
    assignedDimensionId: number | null
  }

  const AuthContext = createContext<AuthContextType | undefined>(undefined)

  export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [admin, setAdmin] = useState<Admin | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
      // Get initial session
      const getInitialSession = async () => {
        setIsLoading(true)

        try {
          const { data: sessionData } = await supabase.auth.getSession()

          setSession(sessionData.session)
          setUser(sessionData.session?.user || null)

          if (sessionData.session?.user) {
            // Fetch admin data
           const { data: adminData } = await supabase
            .from("admins")
            .select(`
              id,
              email,
              full_name,
              assigned_dimension_id,
              created_at,
              updated_at,
              status,
              last_active_at,
              role:roles(id, name)
            `)
            .eq("id", sessionData.session.user.id)
            .single()

          //   if (adminData?.status === "suspended") {
          //   await supabase.auth.signOut()
          //   router.push("/login?error=account_suspended")
          //   return
          // }

            if (adminData) {
              setAdmin({
                ...adminData,
                role: adminData.role && adminData.role.length > 0 ? adminData.role[0] : null,
              })
            } else {
              setAdmin(null)
            }
          }
        } catch (error) {
          console.error("Error getting initial session:", error)
        } finally {
          setIsLoading(false)
        }
      }

      getInitialSession()

      // Set up auth state change listener
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        setSession(newSession)
        setUser(newSession?.user || null)

        if (newSession?.user) {
          // Fetch admin data
          const { data: adminData } = await supabase.from("admins").select("*").eq("id", newSession.user.id).single()

        //   if (adminData?.status === "suspended") {
        //   await supabase.auth.signOut()
        //   router.push("/login?error=account_suspended")
        //   return
        // }

          setAdmin(adminData)

          await supabase.from("admins").update({ last_active_at: new Date().toISOString() }).eq("id", newSession.user.id)
        } else {
          setAdmin(null)
        }

        setIsLoading(false)    

        // Handle auth state changes
        // if (event === "SIGNED_IN" && pathname === "/login") {
        //   router.push("/dashboard")
        // } else if (event === "SIGNED_OUT") {
        //   router.push("/login")
        // }
      })

      return () => {
        authListener.subscription.unsubscribe()
      }
    }, [pathname, router])

    const signIn = async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error }
    }

    const signUp = async (email: string, password: string, fullName: string) => {
      // Only master admins can create new users, so this is just for the API
      // The actual user creation will happen in the admin panel
      const { data, error } = await supabase.auth.signUp({ email, password })
      return { data, error }
    }

    const signOut = async () => {
      await supabase.auth.signOut()
      router.push("/login")
    }

    const resetPassword = async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      return { error }
    }

    const updatePassword = async (password: string) => {
      const { error } = await supabase.auth.updateUser({ password })
      return { error }
    }

    const sendOTP = async (email: string, userId: string) => {
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, userId }),
      })

      if (!response.ok) {
        const data = await response.json()
        return { error: data.error || "Failed to send OTP" }
      }

      return { error: null }
    } catch (error: any) {
      return { error: error.message || "Failed to send OTP" }
    }
  }

  const verifyOTP = async (email: string, userId: string, otp: string) => {
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, userId, otp }),
      })

      if (!response.ok) {
        const data = await response.json()
        return { error: data.error || "Failed to verify OTP" }
      }

      return { error: null }
    } catch (error: any) {
      return { error: error.message || "Failed to verify OTP" }
    }
  }


    const rolesReady = !isLoading && admin !== null;

    // Role-based permissions
    const isMasterAdmin = admin?.role?.name === "Master Admin"
    const isOverallFocalPerson = admin?.role?.name === "Overall Focal Person"
    const isDimensionLeader = admin?.role?.name === "Dimension Leader"
    const isDimensionMember = admin?.role?.name === "Dimension Member"


    // Derived permissions
    const canManageAdmins = isMasterAdmin || isOverallFocalPerson
    const canAccessAllDimensions = isMasterAdmin || isOverallFocalPerson
    const canDeleteItems = isMasterAdmin || isOverallFocalPerson
    const assignedDimensionId = admin?.assigned_dimension_id || null

    const value = {
      user,
      admin,
      session,
      rolesReady,
      isLoading,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updatePassword,
      sendOTP,
      verifyOTP,
      isMasterAdmin,
      isOverallFocalPerson,
      isDimensionLeader,
      isDimensionMember,
      canManageAdmins,
      canAccessAllDimensions,
      canDeleteItems,
      assignedDimensionId,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  }

  export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
      throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
  }
