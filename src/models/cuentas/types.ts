/**
 * Domain Models for Cuentas Corrientes (Current Account / Fiado)
 */

// Client information linked to cuenta corriente
export interface Cliente {
  id: string;
  nombre: string;
  telefono?: string;
  email?: string;
  limiteCredito?: number;
}

// Main cuenta corriente entity
export interface CuentaCorriente {
  id: string;
  clienteId: string;
  estado: CuentaEstado;
  totalComprado: number;
  totalEntregado: number;
  saldoActual: number;
  limiteCredito?: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export type CuentaEstado = 'ACTIVA' | 'SALDADA' | 'BLOQUEADA';

// Sale linked to a cuenta corriente
export interface VentaCuenta {
  id: string;
  cuentaId: string;
  ventaId: string;
  montoTotal: number;
  montoEntregado: number;
  montoPendiente: number;
  estado: VentaCuentaEstado;
  fechaVenta: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type VentaCuentaEstado = 'PENDIENTE' | 'PAGO_PARCIAL' | 'PAGADA' | 'DESESTIMADA';

// Entrega Status enum
export type EntregaStatus = 'PENDIENTE' | 'PARCIAL' | 'COMPLETA';

// Payment/delivery to cuenta corriente
export interface Entrega {
    id: string;
    cuentaId: string;
    ventaId?: string; // NEW: Reference to venta_cuenta for delivery tracking
    monto: number;
    metodoPago: MetodoPago;
    descripcion?: string;
    
    // NEW FIELDS for delivery tracking (optional until migration is applied)
    cantidadEsperada?: number;        // Total items/units to deliver
    cantidadEntregada?: number;       // Items/units actually delivered
    numeroRemito?: string;            // Delivery ticket/slip number
    status?: EntregaStatus;           // Delivery status: PENDIENTE | PARCIAL | COMPLETA
    fechaCompletado?: Date;           // Date when delivery was fully completed
    
    detalleAplicacion: AplicacionDetalle[];
    createdAt: Date;
    createdBy?: string;
  }

export type MetodoPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'MERCADO_PAGO' | 'TARJETA' | 'OTRO';

export interface AplicacionDetalle {
  ventaId: string;
  montoAplicado: number;
}

// Movement/transaction in the account history
export interface Movimiento {
  id: string;
  cuentaId: string;
  tipo: MovimientoTipo;
  referenciaId?: string;
  referenciaTipo?: string;
  monto: number; // Positive for charges, negative for credits
  saldoAnterior: number;
  saldoNuevo: number;
  descripcion?: string;
  createdAt: Date;
}

export type MovimientoTipo = 'COMPRA' | 'ENTREGA' | 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO' | 'DESESTIMACION';

// Alertas calculation
export type AlertaCodigo = 'ACERCANDO_LIMITE' | 'EXCEDE_LIMITE' | 'MORA_30_DIAS';

// Simplified response types
export interface CuentaConCliente extends CuentaCorriente {
  cliente: {
    id: string;
    nombre: string;
    telefono?: string;
  };
  alertas: AlertaCodigo[];
  ventasPendientes: VentaCuenta[];
  ultimaEntrega?: {
    fecha: Date;
    monto: number;
  };
}

export interface CuentaListItem {
  id: string;
  clienteId: string;
  clienteNombre: string;
  estado: CuentaEstado;
  saldoActual: number;
  limiteCredito?: number;
  createdAt: Date;
}