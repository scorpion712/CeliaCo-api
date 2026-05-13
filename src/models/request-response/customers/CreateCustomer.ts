export type CreateCustomerRequest = {
    name: string; 
    phone: string; 
    fiscalId: string;
    idNumber: string;
    ivaCategory: string;
}

export type CreateCustomerResponse = {
    id: string;
}