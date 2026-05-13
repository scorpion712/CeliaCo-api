import { GetCustomersRequest, GetCustomersResponse, UpdateCustomerRequest, UpdateCustomerResponse } from "../../models";
import { Customer } from "./models/Customer";

export interface ICustomersRepository {
    createCustomer(customer: Customer): Promise<string>;
    getCustomer(customerId: string): Promise<Customer>;
    getCustomerByDNI(customerIdNumber: string): Promise<Customer | null>;
    getCustomerByFiscalId(customerFiscalIdNumber: string): Promise<Customer | null>;
    getCustomerByName(name: string): Promise<Customer | null>;
    getCustomers(filter: GetCustomersRequest): Promise<GetCustomersResponse>;
    updateCustomer(customer: UpdateCustomerRequest): Promise<UpdateCustomerResponse>;
    deleteCustomer(customerId: string): Promise<void>;
    activateCustomer(customerId: string): Promise<void>;
}