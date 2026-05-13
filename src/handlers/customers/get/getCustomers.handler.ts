import { CustomersService } from "../../../services/customers/Customers.service";
import { CustomersRepository } from "../../../repositories";
import { GetCustomersCommand } from "../../../models/request-response/customers/commands";
import { GetCustomersResponse } from "../../../models";

// Create service instance
const customersRepository = new CustomersRepository();
const customersService = new CustomersService(customersRepository);

/**
 * Handler for listing customers with filters.
 */
export const getCustomersHandler = async (command: GetCustomersCommand): Promise<GetCustomersResponse> => {
    return customersService.getCustomers({
        limit: command.limit,
        offset: command.offset,
        tab: command.tab,
        search: command.search,
    });
};
