import {   GetSaleResponse, PrintTicketRequest, TicketInfo } from "../../models";
import { Customer } from "../../repositories";

export const adaptToPrintableTicket = (body: { sale: GetSaleResponse, customer: Customer}) => {
  const { sale, customer } = body;

  return {
    total: sale.total,
    totalIva: sale.items.reduce((a,b) => a + b.total * b.iva * b.quantity, 0), // TO DO : review 
    customer: { 
        type: customer.type, // TO DO: analizar tipo categoria 
        name: customer.name,
        cuit: customer.fiscalId,
        category: customer.ivaCategory, // TO DO: analizar 
        address: customer.address, // TO DO: revisar que se guarde la direccion (es necesario?)
    },
    date: sale.createdAt,
    items: sale.items.map(item => ({
        qty: item.quantity,
        description: item.product,
        ivaPct: item.iva,
        total: item.total // TO DO: analizar si es total o multiplico por qty
    })),
    arcaData:  sale.cae ? {
        ptoVenta: sale.ptoVenta,
        nroVenta: sale.nroVenta,
        nroCbte: sale.nroCbte,
        cae: sale.cae,
        qrData: sale.qrData
    } : null
  } as TicketInfo;
};
