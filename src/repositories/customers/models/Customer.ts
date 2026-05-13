export type Customer = {
    id: string;
    name: string;
    fiscalId: string;
    idNumber: string;
    createdAt: Date;
    ivaCategory: string;
    phone: string | null; 
    disabled: boolean;
    deletedAt?: Date;
    address?: string;
    type: string;
}