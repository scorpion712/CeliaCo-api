import { CustomersService } from "../../../services/customers/Customers.service";
import { CustomersRepository } from "../../../repositories";
import { CreateCustomerCommand } from "../../../models/request-response/customers/commands";
import { Customer } from "../../../repositories";

// Create service instance
const customersRepository = new CustomersRepository();
const customersService = new CustomersService(customersRepository);

export interface CreateCustomerResult {
    id: string;
}

/**
 * Handler for creating a customer.
 */
export const createCustomerHandler = async (command: CreateCustomerCommand): Promise<CreateCustomerResult> => {
    const customerId = await customersService.createCustomer({
        name: command.name,
        phone: command.phone ?? null,
        fiscalId: command.fiscalId ?? "",
        idNumber: command.idNumber ?? "",
        ivaCategory: command.ivaCategory ?? "",
    } as Customer);
    return { id: customerId };
};
