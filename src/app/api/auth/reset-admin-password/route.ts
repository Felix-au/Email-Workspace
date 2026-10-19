import dbConnect from "@/lib/db";
import { User } from "@/models/User";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST() {
  try {
    await dbConnect();

    const domain = process.env.NEXT_PUBLIC_DOMAIN || "yourdomain.com";
    const adminEmail = `admin@${domain}`.toLowerCase();

    // Locate existing admin by role, username, or admin email
    let admin = await User.findOne({
      $or: [
        { role: "ADMIN" },
        { username: "admin" },
        { email: adminEmail },
      ],
    });

    const defaultPassword = "admin123";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    if (admin) {
      // Only reset the admin's password back to the initial seed password
      admin.password = hashedPassword;
      admin.status = "APPROVED";
      admin.role = "ADMIN";
      await admin.save();
    } else {
      // If admin doesn't exist yet, seed the admin account with initial credentials
      admin = await User.create({
        username: "admin",
        email: adminEmail,
        password: hashedPassword,
        role: "ADMIN",
        status: "APPROVED",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Admin password has been reset to default (admin123).",
    });
  } catch (error: unknown) {
    console.error("Reset admin password error:", error);
    const message = error instanceof Error ? error.message : "Failed to reset admin password";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
