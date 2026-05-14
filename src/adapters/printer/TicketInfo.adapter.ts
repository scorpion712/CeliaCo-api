import { CreateSaleRequest, TicketInfo } from "../../models";
import { calcIvaAmounts } from "../../services";

export const adaptToTicketInfo = (body: CreateSaleRequest) => {
    const totalIva = calcIvaAmounts(body.cartItems.map((item) => ({
      product: {
        price: item.price,
        iva: item.iva,
      },
      qty: item.quantity,
    })));
    return {
        arcaData: body.arcaData ? {
            ptoVenta: body.arcaData.ptoVenta,
            nroVenta: body.arcaData.nroCbte,
            cae: body.arcaData.afip?.CAE ?? '',
            caeExpiry: body.arcaData.afip?.CAEFchVto ?? '',
            qrData: body.arcaData.qrData ?? ''
        } : null,
        items: body.cartItems.map(i => ({
            qty: i.quantity,
            description: i.name,
            ivaPct: i.iva,
            total: i.total
        })),
        total: body.total,
        totalIva: totalIva.iva10_5 + totalIva.iva21,
        customer: {
            type: 'Consumidor Final',
            name: 'Consumidor Final',
            cuit: '',
            category: 'Consumidor Final',
            address: ''
        }
    } as TicketInfo
}