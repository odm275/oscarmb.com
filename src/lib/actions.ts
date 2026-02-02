"use server";

import ContactFormEmail from "@/components/email/ContactFormEmail";
import * as Sentry from "@sentry/nextjs";
import { Resend } from "resend";
import { z } from "zod";
import { ContactFormSchema } from "./schemas";

const resend = new Resend(process.env.RESEND_API_KEY);

type ContactFormInputs = z.infer<typeof ContactFormSchema>;

export async function sendEmail(data: ContactFormInputs) {
  const result = ContactFormSchema.safeParse(data);

  if (result.error) {
    return { error: result.error.format() };
  }

  try {
    const { name, email, message } = result.data;

    const { data, error } = await resend.emails.send({
      from: "Contact Form <noreply@updates.oscarmb.com>",
      to: "oscarmejiaweb@gmail.com",
      replyTo: [email],
      subject: `New message from ${name}!`,
      text: `Name:\n${name}\n\nEmail:\n${email}\n\nMessage:\n${message}`,
      // react: ContactFormEmail({ name, email, message }),
    });

    if (!data || error) {
      throw new Error(error?.message || "Failed to send email!");
    }

    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      extra: {
        action: "sendEmail",
        recipient: result.data.email,
      },
    });
    return { error: error instanceof Error ? error.message : "An unknown error occurred" };
  }
}
