export type GetCustomerRequest = {
    id: string;
}

export type GetCustomerResponse = {
    id: string; 
    name: string;
    phone: string;
    fiscalId: string;
    idNumber: string;
    ivaCategory: string;
    address: string;
}