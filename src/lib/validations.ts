import { z } from "zod";

export const LoginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(8),
});

export const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  username: z.string().min(3),
  password: z.string().min(8),
});
