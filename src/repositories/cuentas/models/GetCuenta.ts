/**
 * Repository model for getting cuenta corriente with client info
 */
export type GetCuenta = {
  id: string;
  clienteId: string;
  estado: 'ACTIVA' | 'SALDADA' | 'BLOQUEADA';
  totalComprado: number;
  totalEntregado: number;
  saldoActual: number;
  limiteCredito?: number;
  createdAt: Date;
  updatedAt: Date;
  // Joined client info
  clienteNombre?: string;
  clienteTelefono?: string;
  clienteEmail?: string;
  // Campos calculados para UI
  ultimaCompra?: string;
  ultimoPago?: string;
};

export type GetCuentaWithCliente = GetCuenta & {
  cliente: {
    id: string;
    nombre: string;
    telefono?: string;
    email?: string;
  };
};