import { Result } from 'typescript-result';
import type { UserRepository } from '@/domain/user/user.repository.ts';
import type { UserType } from '@/domain/user/user.type.ts';
import { prisma } from '@/pkg/database/prisma.ts';

type UserRow = {
  id: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  role: UserType['role'];
};

function toDomain(row: UserRow): UserType {
  return {
    id: row.id,
    email: row.email,
    password: row.password,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    role: row.role,
  };
}

export class PrismaUserRepository implements UserRepository {
  async findById(id: string): Promise<Result<UserType | null, Error>> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });
      return Result.ok(user ? toDomain(user) : null);
    } catch (error) {
      return Result.error(error as Error);
    }
  }

  async findAll(): Promise<Result<UserType[], Error>> {
    try {
      const users = await prisma.user.findMany();
      return Result.ok(users.map(toDomain));
    } catch (error) {
      return Result.error(error as Error);
    }
  }

  async findByEmail(email: string): Promise<Result<UserType | null, Error>> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      return Result.ok(user ? toDomain(user) : null);
    } catch (error) {
      return Result.error(error as Error);
    }
  }

  async create(user: UserType): Promise<Result<UserType, Error>> {
    try {
      const created = await prisma.user.create({
        data: {
          email: user.email,
          password: user.password,
          role: user.role,
        },
      });
      return Result.ok(toDomain(created));
    } catch (error) {
      return Result.error(error as Error);
    }
  }

  async update(user: UserType): Promise<Result<UserType, Error>> {
    try {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          email: user.email,
          password: user.password,
          deletedAt: user.deletedAt,
          role: user.role,
        },
      });
      return Result.ok(toDomain(updated));
    } catch (error) {
      return Result.error(error as Error);
    }
  }

  async delete(id: string): Promise<Result<boolean, Error>> {
    try {
      const result = await prisma.user.deleteMany({ where: { id } });
      return Result.ok(result.count > 0);
    } catch (error) {
      return Result.error(error as Error);
    }
  }
}
