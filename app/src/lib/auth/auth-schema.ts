import { z } from "zod";

export const loginFormSchema = z.object({
  email: z.email("Email invalide").toLowerCase().trim(),
  password: z.string().min(1, "Mot de passe requis"),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

const passwordRegisterSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères")
  .max(128, "Le mot de passe ne doit pas dépasser 128 caractères")
  .refine(
    (v) => /[a-zA-Z]/.test(v) && /\d/.test(v),
    "Le mot de passe doit contenir au moins une lettre et un chiffre",
  );

export const registerFormSchema = z.object({
  email: z.email("Email invalide").toLowerCase().trim(),
  password: passwordRegisterSchema,
});

export type RegisterFormValues = z.infer<typeof registerFormSchema>;
