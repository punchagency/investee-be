import { AppDataSource } from "../db";
import { Repository } from "typeorm";
import { AiModel } from "../entities/AiModel.entity";

export class AiStorage {
  private aiModelRepo: Repository<AiModel>;

  constructor() {
    this.aiModelRepo = AppDataSource.getRepository(AiModel);
  }

  async getAiModelByModelId(model: string): Promise<AiModel | undefined> {
    const aiModel = await this.aiModelRepo.findOne({ where: { model } });
    return aiModel || undefined;
  }

  async upsertAiModel(
    data: Partial<AiModel> & { model: string }
  ): Promise<AiModel> {
    let existing = await this.getAiModelByModelId(data.model);

    if (existing) {
      Object.assign(existing, data);
      // lastTrainedAt is often updated without changing other fields
      return await this.aiModelRepo.save(existing);
    } else {
      const newModel = this.aiModelRepo.create(data);
      return await this.aiModelRepo.save(newModel);
    }
  }
}

export const aiStorage = new AiStorage();
