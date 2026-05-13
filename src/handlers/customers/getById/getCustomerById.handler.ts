import { CustomersService } from "../../../services/customers/Customers.service";
import { CustomersRepository } from "../../../repositories";
import { GetCustomerByIdCommand } from "../../../models/request-response/customers/commands";
import { GetCustomerResponse } from "../../../models";

// Create service instance
const customersRepository = new CustomersRepository();
const customersService = new CustomersService(customersRepository);

export interface GetCustomerByIdResult {
    id: string;
    name: string;
    phone: string;
    fiscalId: string;
    idNumber: string;
    ivaCategory: string;
}

/**
 * Handler for getting a customer by ID.
 */
export const getCustomerByIdHandler = async (command: GetCustomerByIdCommand): Promise<GetCustomerByIdResult> => {
    const customer = await customersService.getCustomerById(command.id);
    return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone ?? "",
        fiscalId: customer.fiscalId ?? "",
        idNumber: customer.idNumber ?? "",
        ivaCategory: customer.ivaCategory ?? "",
    };
};
