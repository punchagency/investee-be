import { AppDataSource } from "../db";
import { Repository } from "typeorm";
import { User } from "../entities/User.entity";

export class UserStorage {
  private userRepo: Repository<User>;

  constructor() {
    this.userRepo = AppDataSource.getRepository(User);
  }

  async getUser(id: string): Promise<User | undefined> {
    const user = await this.userRepo.findOne({ where: { id } });
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await this.userRepo.findOne({ where: { email } });
    return user || undefined;
  }

  async getUserByEmailWithPassword(email: string): Promise<User | undefined> {
    const user = await this.userRepo
      .createQueryBuilder("user")
      .where("user.email = :email", { email })
      .addSelect("user.password")
      .getOne();
    return user || undefined;
  }

  async upsertUser(userData: Partial<User> & Pick<User, "id">): Promise<User> {
    const existing = await this.userRepo.findOne({
      where: { id: userData.id },
    });

    if (existing) {
      Object.assign(existing, userData);
      existing.updatedAt = new Date();
      return await this.userRepo.save(existing);
    } else {
      const user = this.userRepo.create(userData);
      return await this.userRepo.save(user);
    }
  }
}

export const userStorage = new UserStorage();
