import * as argon2 from 'argon2';

export class AuthService {
  async passwordHash(password: string) {
    return await argon2.hash(password);
  }

  async verifyPasswordHash(password: string, hash: string) {
    return await argon2.verify(hash, password);
  }
}
