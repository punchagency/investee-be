import { AppDataSource } from "../db";
import { Repository } from "typeorm";
import { PropertyAlert } from "../entities/PropertyAlert.entity";

export class PropertyAlertStorage {
  private alertRepo: Repository<PropertyAlert>;

  constructor() {
    this.alertRepo = AppDataSource.getRepository(PropertyAlert);
  }

  async createAlert(
    alert: Partial<Omit<PropertyAlert, "id" | "createdAt" | "updatedAt">>
  ): Promise<PropertyAlert> {
    const created = this.alertRepo.create(alert);
    return await this.alertRepo.save(created);
  }

  async getAlert(id: string): Promise<PropertyAlert | undefined> {
    const alert = await this.alertRepo.findOne({ where: { id } });
    return alert || undefined;
  }

  async getAlertsByUser(userId: string): Promise<PropertyAlert[]> {
    return await this.alertRepo.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });
  }

  async updateAlert(
    id: string,
    updates: Partial<PropertyAlert>
  ): Promise<PropertyAlert | undefined> {
    const alert = await this.alertRepo.findOne({ where: { id } });
    if (!alert) return undefined;

    Object.assign(alert, updates);
    alert.updatedAt = new Date();
    return await this.alertRepo.save(alert);
  }

  async deleteAlert(id: string): Promise<void> {
    await this.alertRepo.delete({ id });
  }
}

export const propertyAlertStorage = new PropertyAlertStorage();
