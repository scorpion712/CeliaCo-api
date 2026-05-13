/**
 * Repository model for getting venta cuenta details
 */
export interface DetalleAplicacion {
  entregaId: string;
  fecha: string;
  cantidad: number;
  numeroRemito: string;
  status: string;
}

export interface EntregaPendiente {
  id: string;
  ventaId?: string;
  cantidadEsperada: number;
  cantidadEntregada: number;
  numeroRemito: string;
  status: string;
}

export type GetVentaCuenta = {
  id: string;
  cuentaId: string;
  ventaId: string;
  montoTotal: number;
  montoEntregado: number;
  montoPendiente: number;
  estado: 'PENDIENTE' | 'PAGO_PARCIAL' | 'PAGADA' | 'DESESTIMADA';
  fechaVenta: Date;
  createdAt: Date;
  updatedAt: Date;
  // Optional joined sale info
  ventaTotal?: number;
  ventaFecha?: Date;
  // productos de la venta
  productos?: {
    id: string;
    productId: string;
    productName: string;
    cantidad: number;
    precio: number;
    total: number;
  }[];
  // NEW: Delivery application details
  detallesEntrega?: DetalleAplicacion[];
  entregasPendientes?: EntregaPendiente[];
};

export type GetVentaCuentaWithSale = GetVentaCuenta & {
  venta: {
    id: string;
    total: number;
    createdAt: Date;
  };
};