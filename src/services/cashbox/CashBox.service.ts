import { CashBox } from "../../models/cashbox/CashBox";
import { CashBoxRepository } from "../../repositories/cashbox/ICashBoxRepository";

export class CashBoxService {
  constructor(private cashBoxRepository: CashBoxRepository) {}

  async getTodayBox(): Promise<CashBox> {
    return await this.cashBoxRepository.getOrCreateTodayBox();
  }

  async closeBox(id: string, cierre: number): Promise<void> {
    await this.cashBoxRepository.closeBox(id, cierre);
  }
}