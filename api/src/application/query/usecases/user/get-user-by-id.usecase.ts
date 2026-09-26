import { Result } from 'typescript-result';
import type { UserRepository } from '@/domain/user/user.repository.ts';
import type { PublicUser } from '@/domain/user/user.type.ts';

export class GetUserByIdUsecase {
  private readonly userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  async execute(id: string): Promise<Result<PublicUser | null, Error>> {
    const result = await this.userRepository.findById(id);
    if (!result.ok) return result;
    if (result.value === null) return Result.ok(null);
    const { password, ...safeUser } = result.value;
    void password;
    return Result.ok(safeUser);
  }
}
