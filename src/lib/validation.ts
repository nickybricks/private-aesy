import { z } from 'zod';

// Authentication schemas
export const signInSchema = z.object({
  email: z.string()
    .trim()
    .min(1, 'E-Mail ist erforderlich')
    .email('Ungültige E-Mail-Adresse')
    .max(255, 'E-Mail darf maximal 255 Zeichen lang sein'),
  password: z.string()
    .min(6, 'Passwort muss mindestens 6 Zeichen lang sein')
    .max(100, 'Passwort darf maximal 100 Zeichen lang sein')
});

export const signUpSchema = z.object({
  email: z.string()
    .trim()
    .min(1, 'E-Mail ist erforderlich')
    .email('Ungültige E-Mail-Adresse')
    .max(255, 'E-Mail darf maximal 255 Zeichen lang sein'),
  password: z.string()
    .min(6, 'Passwort muss mindestens 6 Zeichen lang sein')
    .max(100, 'Passwort darf maximal 100 Zeichen lang sein'),
  displayName: z.string()
    .trim()
    .min(1, 'Name ist erforderlich')
    .max(100, 'Name darf maximal 100 Zeichen lang sein')
});

export const resetPasswordSchema = z.object({
  email: z.string()
    .trim()
    .min(1, 'E-Mail ist erforderlich')
    .email('Ungültige E-Mail-Adresse')
    .max(255, 'E-Mail darf maximal 255 Zeichen lang sein')
});

export const updatePasswordSchema = z.object({
  password: z.string()
    .min(6, 'Passwort muss mindestens 6 Zeichen lang sein')
    .max(100, 'Passwort darf maximal 100 Zeichen lang sein')
});

// Admin schemas
export const userRoleSchema = z.enum(['customer', 'admin', 'super_admin']);

export const updateUserRoleSchema = z.object({
  userId: z.string().uuid('Ungültige Benutzer-ID'),
  role: userRoleSchema
});

// Stock search schema
export const stockSymbolSchema = z.string()
  .trim()
  .min(1, 'Aktiensymbol ist erforderlich')
  .max(10, 'Aktiensymbol darf maximal 10 Zeichen lang sein')
  .regex(/^[A-Z0-9.\-]+$/i, 'Ungültiges Aktiensymbol-Format');

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
