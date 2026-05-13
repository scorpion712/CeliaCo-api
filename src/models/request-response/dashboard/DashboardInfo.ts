export interface DashboardInfo {
  sales: {
    totalVentasHoy: number;
    transaccionesHoy: number;
  };
  accounts: {
    cuentasPendientes: number;
    totalAdeudado: number;
  };
  products: {
    totalProductos: number;
    productosSinStock: number;
  };
}
