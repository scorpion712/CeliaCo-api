import { GetCustomersRequest, UpdateCustomerRequest } from "../../models";
import { Customer, ICustomersRepository } from "../../repositories";

export class CustomersService {
    constructor(private customersRepository: ICustomersRepository) {}

    async createCustomer(customer: Customer) {

        // Verify no duplicate name (case-insensitive)
        if (customer.name && customer.name.trim().length > 0) {
            const exists = await this.customersRepository.getCustomerByName(customer.name);
            if (exists) throw Error("Ya existe un cliente registrado con el nombre ingresado");
        }

        if (customer.idNumber && customer.idNumber.trim().length > 0) {
            const exists = await this.customersRepository.getCustomerByDNI(customer.idNumber);
            if (exists) throw Error("Ya existe un cliente registrado con el DNI ingresado");
        }
        
        if (customer.fiscalId && customer.fiscalId.trim().length > 0) {
            const exists = await this.customersRepository.getCustomerByFiscalId(customer.fiscalId);
            if (exists) throw Error("Ya existe un cliente registrado con el CUIT ingresado");
        }

        return await this.customersRepository.createCustomer(customer);
    }
         
    async getCustomers(filter: GetCustomersRequest) {
        return await this.customersRepository.getCustomers(filter);
    }

    async getCustomerById(customerId: string) {
        return await this.customersRepository.getCustomer(customerId);
    }

    async updateCustomer(customer: UpdateCustomerRequest) {
        return await this.customersRepository.updateCustomer(customer);
    }

    async deleteCustomer(customerId: string) {
        return await this.customersRepository.deleteCustomer(customerId);
    }

    async activateCustomer(customerId: string) {
        return await this.customersRepository.activateCustomer(customerId);
    }
}