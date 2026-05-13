export type UpdateCustomerRequest = {
    id: string;
    name: string; 
    phone: string; 
    fiscalId: string;
    idNumber: string;
    ivaCategory: string;
}

export type UpdateCustomerResponse = {
    id: string;
}