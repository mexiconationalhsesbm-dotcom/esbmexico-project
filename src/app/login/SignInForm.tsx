"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Alert from "@/components/ui/alert/Alert";
import { useAlert } from "@/context/AlertContext";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [userId, setUserId] = useState<number | null>(null);
  const { showAlert } = useAlert();
  const router = useRouter();
  const supabase = createClient();
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "account_suspended") {
      setError("Your account has been suspended. Please contact an administrator.");
    }
  }, [searchParams]);

  // 🧩 Step 1: Handle credentials verification + OTP sending
const handleCredentialsSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  try {
    // Step 1: Check if email exists and account status
    const { data: admin, error: adminError } = await supabase
      .from("admins")
      .select("id, status")
      .eq("email", email)
      .single();

    if (adminError && adminError.code !== "PGRST116") {
      console.error("Admin check error:", adminError);
      setError("An unexpected error occurred while verifying your account.");
      return;
    }

    if (!admin) {
      setError("No account found with this email.");
      return;
    }

    if (admin.status === "suspended") {
      setError("Your account has been suspended. Please contact an administrator.");
      await logSystemActivity(admin.id, "failed", `Suspended account attempted login: ${email}`);
      return;
    }

    // Step 2: Verify password before sending OTP
    const { data: signInAttempt, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error("Password verification failed:", signInError);
      setError("Invalid email or password.");
      await logSystemActivity(admin.id, "failed", `Invalid password attempt for: ${email}`);
      return;
    }

    // At this point, Supabase has created a session.
    // We’ll sign the user out again — we only want to proceed after OTP verification.
    await supabase.auth.signOut();

    // Store user ID for OTP step
    setUserId(admin.id);

    // Step 4: Check if OTP was verified within last 24 hours
    const { data: otpSession } = await supabase
      .from("otp_verifications")
      .select("verified_at")
      .eq("user_id", admin.id)
      .maybeSingle();

    const now = new Date();
    if (otpSession && otpSession.verified_at) {
      const lastVerified = new Date(otpSession.verified_at);
      const hoursSinceLastVerification = (now.getTime() - lastVerified.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastVerification < 24) {
        // ✅ Skip OTP and sign in directly
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(signInError.message);
          return;
        }

        await logSystemActivity(admin.id, "success", `Login successful (OTP bypassed - within 24hrs): ${email}`);

        showAlert({
          type: "success",
          title: "Welcome back!",
          message: "Logged in securely — OTP not required within 24 hours.",
        });

        router.push("/dashboard");
        router.refresh();
        return;
      }
    }

    // Step 5: Send OTP after password validation
    const response = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, userId: admin.id }),
    });

    const result = await response.json();

    if (!response.ok) {
      setError(result.error || "Failed to send OTP.");
      return;
    }

    showAlert({
      type: "info",
      title: "OTP Sent",
      message: "A one-time password has been sent to your email.",
    });

    await logSystemActivity(admin.id, "success", `Login verification OTP sent to: ${email}`);

    // ✅ Proceed to OTP input step
    setStep("otp");
  } catch (err) {
    console.error("Login error:", err);
    setError("An unexpected error occurred.");
  } finally {
    setLoading(false);
  }
};


// 🧩 Log activity to system_logs
const logSystemActivity = async (userId: number | null, status: string, description: string) => {
  try {
    await supabase.from("system_logs").insert([
      {
        account_id: userId || null,
        action: "ACCOUNT_LOGIN",
        entity_type: "auth",
        status,
        description
      },
    ]);
  } catch (err) {
    console.error("System log insert error:", err);
  }
};

  // 🧩 Step 2: Handle OTP verification
  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, userId, otp }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Invalid OTP. Please try again.");
        return;
      }

      // OTP verified successfully → Sign user in
      const { error: finalSignInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (finalSignInError) {
        setError(finalSignInError.message);
        return;
      }

      await logSystemActivity(userId, 'success', `Login successful, User: ${email}`);

      showAlert({
        type: "success",
        title: "Login Successful",
        message: "Welcome to eSBMexico! Redirecting to dashboard...",
      });

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("OTP verification error:", err);
      setError("An unexpected error occurred during OTP verification.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToCredentials = () => {
    setStep("credentials")
    setOtp("")
    setError(null)
  }

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="mt-8 flex justify-center mb-4">
        <div className="w-full max-w-md">
          {error && <Alert variant="error" title="Sign-in Failed" message={error} />}
        </div>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        {step === "credentials" ? (
          <>
            <div className="mb-5 sm:mb-8">
              <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                Sign In
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {step === "credentials"
              ? "Enter your email and password to access your account"
              : "Enter the OTP code sent to your email"}
              </p>
            </div>

            <form onSubmit={handleCredentialsSubmit} className="space-y-6">
              <div>
                <Label>Email <span className="text-error-500">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@gmail.com"
                />
              </div>

              <div>
                <Label>Password <span className="text-error-500">*</span></Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                    )}
                  </span>
                </div>
              </div>

              {/* <div className="flex items-center justify-end">
                <Link
                  href="/reset-password"
                  className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Forgot password?
                </Link>
              </div> */}

              <Button type="submit" className="w-full" size="sm" disabled={loading}>
                {loading ? "Checking..." : "Sign in"}
              </Button>
            </form>
          </>
        ) : (
          <>
            <div className="mb-5 sm:mb-8 text-center">
              <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                Enter OTP
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                We’ve sent a 6-digit OTP code to <strong>{email}</strong>.
              </p>
            </div>

            <form onSubmit={handleOTPSubmit} className="space-y-6">
              <div>
                <Label>OTP Code</Label>
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  placeholder="Enter your OTP"
                />
              </div>

              <Button type="submit" className="w-full" size="sm" disabled={loading}>
                {loading ? "Verifying..." : "Verify OTP"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full bg-transparent"
                onClick={handleBackToCredentials}
              >
                Back to Login
              </Button>

            </form>
          </>
        )}
      </div>
    </div>
  );
}
