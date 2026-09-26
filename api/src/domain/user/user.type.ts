export const Role = {
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export interface UserType {
  id: string;
  email: string;
  password: string;

  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  role: Role;
}

/** User exposed outside the auth layer (no password). */
export type PublicUser = Omit<UserType, 'password'>;
