import { CustomersService } from "../../../services/customers/Customers.service";
import { CustomersRepository } from "../../../repositories";
import { UpdateCustomerCommand } from "../../../models/request-response/customers/commands";

// Create service instance
const customersRepository = new CustomersRepository();
const customersService = new CustomersService(customersRepository);

export interface UpdateCustomerResult {
    id: string;
}

/**
 * Handler for updating a customer.
 */
export const updateCustomerHandler = async (command: UpdateCustomerCommand): Promise<UpdateCustomerResult> => {
    await customersService.updateCustomer({
        id: command.id,
        name: command.name ?? "",
        phone: command.phone ?? "",
        fiscalId: command.fiscalId ?? "",
        idNumber: command.idNumber ?? "",
        ivaCategory: command.ivaCategory ?? "",
    });
    return { id: command.id };
};
