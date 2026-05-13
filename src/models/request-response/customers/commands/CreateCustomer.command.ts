export interface CreateCustomerCommand {
  name: string;
  phone?: string;
  fiscalId?: string;
  idNumber?: string;
  ivaCategory?: string;
}