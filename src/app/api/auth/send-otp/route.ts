import { createAdminClient } from "@/utils/supabase/server-admin";
import { type NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import nodemailer from "nodemailer";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP via Resend
// async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
//   const resend = new Resend(process.env.RESEND_API_KEY);

//   try {
//     console.log(`[OTP] Sending OTP ${otp} to ${email}`);

//     const { data, error } = await resend.emails.send({
//       from: "eSBMexico Team <onboarding@resend.dev>",
//       to: 'mexiconationalhs.esbm@gmail.com',
//       subject: "Your OTP Code",
//       html: `
//           <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f7f8fa; padding: 30px;">
//             <div style="max-width: 480px; margin: auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
//               <div style="background-color: #0059b3; padding: 20px; text-align: center; color: white;">
//                 <h2 style="margin: 0; font-size: 22px;">eSBMexico Verification</h2>
//               </div>
//               <div style="padding: 25px 30px; color: #333;">
//                 <p style="font-size: 16px;">Hello,</p>
//                 <p style="font-size: 15px;">We received a request to verify your account in <strong>eSBMexico</strong>. Use the code below to complete your login process:</p>
//                 <div style="text-align: center; margin: 25px 0;">
//                   <p style="font-size: 28px; font-weight: bold; letter-spacing: 3px; color: #0059b3;">${otp}</p>
//                 </div>
//                 <p style="font-size: 14px; color: #555;">This code will expire in <strong>10 minutes</strong>. If you didn’t request this, you can ignore this message.</p>
//                 <p style="font-size: 15px; margin-top: 25px;">Best regards,<br><strong>The eSBMexico Team</strong></p>
//               </div>
//               <div style="background-color: #f0f2f5; padding: 15px 30px; text-align: center; font-size: 12px; color: #777;">
//                 <p style="margin: 0;">© 2025 eSBMexico. All rights reserved.</p>
//               </div>
//             </div>
//           </div>
//         `
//     });

//     if (error) {
//       console.error("Resend API error:", error);
//       return false;
//     }

//     console.log("[OTP] Email sent successfully:", data?.id || "(no ID)");
//     return true;

//   } catch (err) {
//     console.error("Error sending OTP email:", err);
//     return false;
//   }
// }

async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  try {
    // ⚙️ Create transporter (using Gmail for example)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER, // your Gmail or custom SMTP email
        pass: process.env.SMTP_PASS, // your App Password (NOT your Gmail password)
      },
    });

    // ✉️ Email content
    const mailOptions = {
      from: `"eSBMexico Team" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Your OTP Code - eSBMexico Verification",
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f7f8fa; padding: 30px;">
          <div style="max-width: 480px; margin: auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
            <div style="background-color: #0059b3; padding: 20px; text-align: center; color: white;">
              <h2 style="margin: 0; font-size: 22px;">eSBMexico Verification</h2>
            </div>
            <div style="padding: 25px 30px; color: #333;">
              <p style="font-size: 16px;">Hello,</p>
              <p style="font-size: 15px;">We received a request to verify your account in <strong>eSBMexico</strong>. Use the code below to complete your login process:</p>
              <div style="text-align: center; margin: 25px 0;">
                <p style="font-size: 28px; font-weight: bold; letter-spacing: 3px; color: #0059b3;">${otp}</p>
              </div>
              <p style="font-size: 14px; color: #555;">This code will expire in <strong>10 minutes</strong>. If you didn’t request this, you can ignore this message.</p>
              <p style="font-size: 15px; margin-top: 25px;">Best regards,<br><strong>The eSBMexico Team</strong></p>
            </div>
            <div style="background-color: #f0f2f5; padding: 15px 30px; text-align: center; font-size: 12px; color: #777;">
              <p style="margin: 0;">© 2025 eSBMexico. All rights reserved.</p>
            </div>
          </div>
        </div>
      `,
    };

    // 🚀 Send email
    await transporter.sendMail(mailOptions);

    console.log(`[OTP] Email sent successfully to ${email}`);
    return true;
  } catch (err) {
    console.error("Error sending OTP email:", err);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, userId } = await request.json();

    if (!email || !userId) {
      return NextResponse.json({ error: "Email and userId are required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 🔹 [ADD THIS BLOCK HERE] Check rate limit before creating new OTP
    const { data: existing } = await supabase
      .from("otp_verifications")
      .select("created_at")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (
      existing &&
      new Date().getTime() - new Date(existing.created_at).getTime() < 60_000
    ) {
      return NextResponse.json(
        { error: "Please wait 1 minute before requesting another OTP." },
        { status: 429 }
      );
    }

    // ✅ Proceed with generating a new OTP after passing rate limit check
    const otp = generateOTP();

    const { error: dbError } = await supabase
      .from("otp_verifications")
      .upsert(
        {
          user_id: userId,
          email,
          otp_code: otp,
          attempts: 0,
          is_verified: false,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        },
        { onConflict: "user_id,email" }
      );

    if (dbError) {
      console.error("Error storing OTP:", dbError);
      return NextResponse.json({ error: "Failed to generate OTP" }, { status: 500 });
    }

    const emailSent = await sendOTPEmail(email, otp);

    if (!emailSent) {
      return NextResponse.json({ error: "Failed to send OTP email" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "OTP sent successfully to email." });

  } catch (err) {
    console.error("Error in send-otp route:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
