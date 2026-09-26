import { z } from 'zod';

/** At least 8 characters, at most 128; at least one letter and one digit. */
const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .max(128, 'Le mot de passe ne doit pas dépasser 128 caractères')
  .refine(
    (v) => /[a-zA-Z]/.test(v) && /\d/.test(v),
    'Le mot de passe doit contenir au moins une lettre et un chiffre',
  );

export const registerBodySchema = z.object({
  email: z.email('Email invalide').toLowerCase().trim(),
  password: passwordSchema,

  role: z.enum(['ADMIN', 'USER']).optional(),
});

export const loginBodySchema = z.object({
  email: z.email('Email invalide').toLowerCase().trim(),
  password: z.string().min(1, 'Mot de passe requis'),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
