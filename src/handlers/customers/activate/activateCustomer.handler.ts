import { CustomersService } from "../../../services/customers/Customers.service";
import { CustomersRepository } from "../../../repositories";
import { ActivateCustomerCommand } from "../../../models/request-response/customers/commands";

// Create service instance
const customersRepository = new CustomersRepository();
const customersService = new CustomersService(customersRepository);

export interface ActivateCustomerResult {
    id: string;
}

/**
 * Handler for activating a customer.
 */
export const activateCustomerHandler = async (command: ActivateCustomerCommand): Promise<ActivateCustomerResult> => {
    await customersService.activateCustomer(command.id);
    return { id: command.id };
};
