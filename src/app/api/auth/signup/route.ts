import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const SignupSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = SignupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid signup data." }, { status: 400 });
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const organization = await db.organization.create({
    data: { name: `${name}'s Workspace` },
  });

  await db.subscription.create({
    data: { organizationId: organization.id, plan: "FREE", status: "ACTIVE" },
  });

  await db.user.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash,
      organizationId: organization.id,
    },
  });

  return NextResponse.json({ ok: true });
}
