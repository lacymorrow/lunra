"use server"

import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function joinWaitingList(formData: FormData) {
  const email = formData.get("email") as string

  if (!email || !email.includes("@")) {
    return {
      success: false,
      message: "Please provide a valid email address",
    }
  }

  try {
    // Store email in your database here if needed

    // Send confirmation email
    await resend.emails.send({
      from: "waitlist@lunra.ai",
      to: email,
      subject: "Welcome to the lunra waiting list",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #f87171; font-weight: normal; font-size: 24px;">Welcome to lunra</h1>
          <p>Thank you for joining our waiting list. We're excited to have you on this journey with us.</p>
          <p>We'll notify you as soon as we're ready to welcome you to our mindful goal planning platform.</p>
          <div style="margin-top: 30px; padding: 20px; background: linear-gradient(to right, #f87171, #fbbf24); border-radius: 10px; color: white;">
            <p style="margin: 0;">Your journey to mindful goal achievement begins soon.</p>
          </div>
          <p style="color: #78716c; font-size: 14px; margin-top: 30px;">With care,<br>The lunra team</p>
        </div>
      `,
    })

    return {
      success: true,
      message: "Thank you for joining our waiting list!",
    }
  } catch (error) {
    console.error("Error sending email:", error)
    return {
      success: false,
      message: "Something went wrong. Please try again.",
    }
  }
}
