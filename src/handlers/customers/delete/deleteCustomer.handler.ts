import { CustomersService } from "../../../services/customers/Customers.service";
import { CustomersRepository } from "../../../repositories";
import { DeleteCustomerCommand } from "../../../models/request-response/customers/commands";

// Create service instance
const customersRepository = new CustomersRepository();
const customersService = new CustomersService(customersRepository);

export interface DeleteCustomerResult {
    id: string;
}

/**
 * Handler for deleting (soft delete) a customer.
 */
export const deleteCustomerHandler = async (command: DeleteCustomerCommand): Promise<DeleteCustomerResult> => {
    await customersService.deleteCustomer(command.id);
    return { id: command.id };
};
