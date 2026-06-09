"use server";

import bcrypt from "bcryptjs";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { failure, success, type ActionResult } from "@/lib/errors";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function signupAction(
  formData: FormData
): Promise<ActionResult<{ email: string }>> {
  try {
    const parsed = signupSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!parsed.success) {
      return failure("Invalid input. Please check your details.");
    }

    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (existing) {
      return failure("An account with this email already exists.");
    }

    const hashed = await bcrypt.hash(parsed.data.password, 12);

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: hashed,
        profile: { create: {} },
      },
    });

    await signIn("credentials", {
      email: user.email,
      password: parsed.data.password,
      redirect: false,
    });

    return success({ email: user.email });
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Signup failed");
  }
}

export async function loginAction(
  formData: FormData
): Promise<ActionResult<{ email: string }>> {
  try {
    const parsed = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!parsed.success) {
      return failure("Invalid email or password.");
    }

    const result = await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    if (result?.error) {
      return failure("Invalid email or password.");
    }

    return success({ email: parsed.data.email });
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Login failed");
  }
}
