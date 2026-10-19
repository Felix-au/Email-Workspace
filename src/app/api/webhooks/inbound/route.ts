import dbConnect from "../../../../lib/db";
import { Email } from "../../../../models/Email";
import { User } from "../../../../models/User";
import { resend } from "../../../../lib/resend";
import { NextResponse } from "next/server";

// Helper to extract clean email address (e.g. "John Doe <john@example.com>" -> "john@example.com")
function extractEmail(address: string): string {
  if (!address) return "";
  const match = address.match(/<([^>]+)>/);
  return match ? match[1].toLowerCase().trim() : address.toLowerCase().trim();
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log("Inbound webhook payload received:", JSON.stringify(payload));

    if (payload.type !== "email.received" || !payload.data) {
      return NextResponse.json({ error: "Invalid webhook event type" }, { status: 400 });
    }

    const { email_id, from: fromRaw, to: toRawList, subject } = payload.data;

    if (!email_id) {
      return NextResponse.json({ error: "Missing email_id in payload data" }, { status: 400 });
    }

    // Fetch the full email content (text, html body) from Resend Inbound API
    const resendRes = await resend.emails.receiving.get(email_id);

    if (resendRes.error) {
      throw new Error(`Failed to retrieve email content from Resend: ${resendRes.error.message}`);
    }

    const emailContent = resendRes.data;
    const textBody = emailContent?.text || "";
    const htmlBody = emailContent?.html || "";

    const fromEmail = extractEmail(fromRaw);
    if (!fromEmail) {
      return NextResponse.json({ error: "Missing sender address" }, { status: 400 });
    }

    await dbConnect();
    const storedEmails = [];

    const recipients = Array.isArray(toRawList) ? toRawList : [toRawList || ""];

    // For each recipient, check if they exist in our registered users or match wildcard admin
    const domain = (process.env.NEXT_PUBLIC_DOMAIN || "yourdomain.com").toLowerCase();

    for (const rawTo of recipients) {
      const toEmail = extractEmail(rawTo);
      if (!toEmail) continue;

      // Verify user exists in database (either via primary email or registered alias)
      const userExists = await User.findOne({
        $or: [
          { email: toEmail },
          { aliases: toEmail },
        ],
      });

      // Check if any admin has a wildcard catch-all alias active for domain emails
      const isDomainEmail = toEmail.endsWith(`@${domain}`);
      const wildcardAdmin = (!userExists && isDomainEmail)
        ? await User.findOne({
            role: "ADMIN",
            aliases: { $in: ["*", `*@${domain}`] },
          })
        : null;

      if (userExists || wildcardAdmin) {
        // Prevent duplicate record if already inserted
        const existingRecord = await Email.findOne({ resendId: email_id, to: toEmail });
        if (!existingRecord) {
          const newEmail = await Email.create({
            resendId: email_id,
            from: fromEmail,
            to: toEmail,
            subject: subject || "(No Subject)",
            textBody,
            htmlBody,
            direction: "INBOUND",
            timestamp: new Date(),
          });
          storedEmails.push(newEmail);
          console.log(`Stored inbound email for ${toEmail} from ${fromEmail} (Wildcard: ${!userExists && !!wildcardAdmin})`);
        }
      } else {
        console.log(`Recipient ${toEmail} is not registered and no catch-all admin active. Email ignored.`);
      }
    }

    return NextResponse.json({
      success: true,
      processedCount: storedEmails.length,
      emails: storedEmails,
    });
  } catch (error: unknown) {
    console.error("Failed to process inbound webhook:", error);
    const message = error instanceof Error ? error.message : "Failed to process webhook";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
