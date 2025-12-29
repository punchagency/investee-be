import { AppDataSource } from "../db";
import { Repository } from "typeorm";
import { LoanApplication } from "../entities/LoanApplication.entity";

export class LoanApplicationStorage {
  private loanApplicationRepo: Repository<LoanApplication>;

  constructor() {
    this.loanApplicationRepo = AppDataSource.getRepository(LoanApplication);
  }

  async createLoanApplication(
    application: Partial<
      Omit<LoanApplication, "id" | "submittedAt" | "updatedAt">
    >
  ): Promise<LoanApplication> {
    const created = this.loanApplicationRepo.create(application);
    return await this.loanApplicationRepo.save(created);
  }

  async getLoanApplication(id: string): Promise<LoanApplication | undefined> {
    const application = await this.loanApplicationRepo.findOne({
      where: { id },
    });
    return application || undefined;
  }

  async getAllLoanApplications(): Promise<LoanApplication[]> {
    return await this.loanApplicationRepo.find({
      order: { submittedAt: "DESC" },
    });
  }

  async updateLoanApplicationStatus(
    id: string,
    status: string
  ): Promise<LoanApplication | undefined> {
    const application = await this.loanApplicationRepo.findOne({
      where: { id },
    });
    if (!application) return undefined;

    application.status = status;
    application.updatedAt = new Date();
    return await this.loanApplicationRepo.save(application);
  }

  async updateLoanApplication(
    id: string,
    updates: Partial<LoanApplication>
  ): Promise<LoanApplication | undefined> {
    const application = await this.loanApplicationRepo.findOne({
      where: { id },
    });
    if (!application) return undefined;

    Object.assign(application, updates);
    application.updatedAt = new Date();
    return await this.loanApplicationRepo.save(application);
  }
}

export const loanApplicationStorage = new LoanApplicationStorage();
