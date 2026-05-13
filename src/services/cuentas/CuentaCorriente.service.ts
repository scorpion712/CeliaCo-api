import createHttpError from 'http-errors';
import { ICuentasCorrientesRepository, GetCuentasFilter, GetMovimientosFilter } from '../../repositories/cuentas/ICuentasCorrientesRepository.interface';
import { GetCuenta, GetCuentaWithCliente } from '../../repositories/cuentas/models/GetCuenta';
import { GetVentaCuenta } from '../../repositories/cuentas/models/GetVentaCuenta';
import { GetMovimiento } from '../../repositories/cuentas/models/GetMovimiento';
import { CuentaCorriente, VentaCuenta, Entrega, Movimiento, CuentaEstado, VentaCuentaEstado, AlertaCodigo, MetodoPago, AplicacionDetalle } from '../../models/cuentas/types';

export class CuentaCorrienteService {
  constructor(private repository: ICuentasCorrientesRepository) {}

  async getOrCreateCuenta(clienteId: string): Promise<GetCuentaWithCliente> {
    const existing = await this.repository.getByClienteId(clienteId);
    
    if (existing) {
      const full = await this.repository.getById(existing.id);
      if (full) return full;
    }

    const nuevaCuenta = {
      clienteId,
      estado: 'ACTIVA' as CuentaEstado,
      totalComprado: 0,
      totalEntregado: 0,
      saldoActual: 0,
    };

    const id = await this.repository.create(nuevaCuenta);
    
    const created = await this.repository.getById(id);
    if (!created) {
      throw createHttpError(500, 'Failed to create account');
    }

    return created;
  }

  async createCuenta(clienteId: string, limiteCredito?: number): Promise<GetCuentaWithCliente> {
    const existing = await this.repository.getByClienteId(clienteId);
    if (existing) {
      throw createHttpError(400, 'Client already has an account');
    }

    const nuevaCuenta = {
      clienteId,
      estado: 'ACTIVA' as CuentaEstado,
      totalComprado: 0,
      totalEntregado: 0,
      saldoActual: 0,
      limiteCredito,
    };

    const id = await this.repository.create(nuevaCuenta);
    
    const created = await this.repository.getById(id);
    if (!created) {
      throw createHttpError(500, 'Failed to create account');
    }

    return created;
  }

  async getCuentaById(id: string): Promise<GetCuentaWithCliente | null> {
    return await this.repository.getById(id);
  }

  async getCuentaByClienteId(clienteId: string): Promise<GetCuenta | null> {
    return await this.repository.getByClienteId(clienteId);
  }

  async getCuentas(filter: GetCuentasFilter) {
    return await this.repository.getAll(filter);
  }

  async createVentaCuenta(cuentaId: string, ventaId: string, montoTotal: number): Promise<VentaCuenta> {
    const cuenta = await this.repository.getById(cuentaId);
    if (!cuenta) {
      throw createHttpError(404, 'Account not found');
    }

    const nuevoTotalComprado = cuenta.totalComprado + montoTotal;
    const nuevoSaldoActual = nuevoTotalComprado - cuenta.totalEntregado;

    const nuevoEstado = this.calcularEstado(nuevoSaldoActual, cuenta.limiteCredito);

    const ventaCuentaId = await this.repository.createVentaCuenta({
      cuentaId,
      ventaId,
      montoTotal,
      montoEntregado: 0,
      montoPendiente: montoTotal,
      estado: 'PENDIENTE' as VentaCuentaEstado,
      fechaVenta: new Date(),
    });

    await this.repository.update(cuentaId, {
      totalComprado: nuevoTotalComprado,
      saldoActual: nuevoSaldoActual,
      estado: nuevoEstado,
    });

    await this.repository.createMovimiento({
      cuentaId,
      tipo: 'COMPRA',
      referenciaId: ventaId,
      referenciaTipo: 'VENTA',
      monto: montoTotal,
      saldoAnterior: cuenta.saldoActual,
      saldoNuevo: nuevoSaldoActual,
      descripcion: `Credit sale for $${montoTotal}`,
    });

    const venta = await this.repository.getVentaCuentaById(ventaCuentaId);
    if (!venta) {
      throw createHttpError(500, 'Failed to retrieve credit sale');
    }

    return venta;
  }

  async registrarEntrega(
    cuentaId: string,
    monto: number,
    metodoPago: MetodoPago,
    descripcion?: string,
    aplicarAVentaId?: string,
    createdBy?: string
  ): Promise<Entrega> {
    const cuenta = await this.repository.getById(cuentaId);
    if (!cuenta) {
      throw createHttpError(404, 'Account not found');
    }

    if (monto > cuenta.saldoActual) {
      throw createHttpError(400, `Amount exceeds pending balance of $${cuenta.saldoActual}`);
    }

    const ventas = await this.repository.getVentasByCuentaId(cuentaId);
    const ventasPendientes = ventas
      .filter(v => v.estado !== 'PAGADA' && v.estado !== 'DESESTIMADA')
      .sort((a, b) => new Date(a.fechaVenta).getTime() - new Date(b.fechaVenta).getTime());

    let detalleAplicacion: AplicacionDetalle[] = [];
    let montoRestante = monto;

    if (aplicarAVentaId) {
      const venta = ventasPendientes.find(v => v.id === aplicarAVentaId);
      if (!venta) {
        throw createHttpError(400, 'Sale does not belong to this account');
      }

      const montoAplicado = Math.min(montoRestante, venta.montoPendiente);
      detalleAplicacion.push({ ventaId: venta.id, montoAplicado });
      montoRestante -= montoAplicado;

      const nuevoMontoEntregado = venta.montoEntregado + montoAplicado;
      const nuevoMontoPendiente = Math.max(0, venta.montoPendiente - montoAplicado);
      const nuevoEstado = this.calcularVentaEstado(nuevoMontoEntregado, venta.montoTotal);

      await this.repository.updateVentaCuenta(venta.id, {
        montoEntregado: nuevoMontoEntregado,
        montoPendiente: nuevoMontoPendiente,
        estado: nuevoEstado,
      });
    } else {
      detalleAplicacion = this.aplicarFIFO(ventasPendientes, montoRestante);
      
      for (const aplicacion of detalleAplicacion) {
        const venta = ventasPendientes.find(v => v.id === aplicacion.ventaId);
        if (!venta) continue;

        const nuevoMontoEntregado = venta.montoEntregado + aplicacion.montoAplicado;
        const nuevoMontoPendiente = Math.max(0, venta.montoPendiente - aplicacion.montoAplicado);
        const nuevoEstado = this.calcularVentaEstado(nuevoMontoEntregado, venta.montoTotal);

        await this.repository.updateVentaCuenta(venta.id, {
          montoEntregado: nuevoMontoEntregado,
          montoPendiente: nuevoMontoPendiente,
          estado: nuevoEstado,
        });
      }

      montoRestante = 0;
    }

    const nuevoTotalEntregado = cuenta.totalEntregado + monto;
    const nuevoSaldoActual = Math.max(0, cuenta.totalComprado - nuevoTotalEntregado);

    const nuevoEstado = this.calcularEstado(nuevoSaldoActual, cuenta.limiteCredito);

    await this.repository.update(cuentaId, {
      totalEntregado: nuevoTotalEntregado,
      saldoActual: nuevoSaldoActual,
      estado: nuevoEstado,
    });

     const entregaId = await this.repository.createEntrega({
       cuentaId,
       monto,
       metodoPago,
       descripcion,
       detalleAplicacion,
       createdBy,
       // NEW: Delivery tracking fields
       cantidadEsperada: 1, // Default: 1 unit per delivery for now
       cantidadEntregada: 1, // Mark as delivered on creation
       status: 'COMPLETA', // Default: mark as complete
     });

    await this.repository.createMovimiento({
      cuentaId,
      tipo: 'ENTREGA',
      referenciaId: entregaId,
      referenciaTipo: 'ENTREGA',
      monto: -monto,
      saldoAnterior: cuenta.saldoActual,
      saldoNuevo: nuevoSaldoActual,
      descripcion: descripcion ?? `Entrega de $${monto}`,
    });

    const entregas = await this.repository.getEntregasByCuentaId(cuentaId, 1, 0);
    if (!entregas.data || entregas.data.length === 0) {
      throw createHttpError(500, 'Failed to retrieve payment');
    }

    return entregas.data[0];
  }

  private aplicarFIFO(ventasPendientes: GetVentaCuenta[], monto: number): AplicacionDetalle[] {
    const detalle: AplicacionDetalle[] = [];
    let montoRestante = monto;

    for (const venta of ventasPendientes) {
      if (montoRestante <= 0) break;

      if (venta.montoPendiente <= 0) continue;

      const montoAplicado = Math.min(montoRestante, venta.montoPendiente);
      detalle.push({ ventaId: venta.id, montoAplicado });
      montoRestante -= montoAplicado;
    }

    return detalle;
  }

  private calcularEstado(saldoActual: number, limiteCredito?: number): CuentaEstado {
    if (saldoActual === 0) {
      return 'SALDADA';
    }
    if (limiteCredito && saldoActual > limiteCredito) {
      return 'BLOQUEADA';
    }
    return 'ACTIVA';
  }

  private calcularVentaEstado(montoEntregado: number, montoTotal: number): VentaCuentaEstado {
    if (montoEntregado >= montoTotal) {
      return 'PAGADA';
    }
    if (montoEntregado > 0) {
      return 'PAGO_PARCIAL';
    }
    return 'PENDIENTE';
  }

  calcularAlertas(cuenta: GetCuentaWithCliente): AlertaCodigo[] {
    const alertas: AlertaCodigo[] = [];

    if (cuenta.limiteCredito) {
      if (cuenta.saldoActual > cuenta.limiteCredito * 0.8) {
        alertas.push('ACERCANDO_LIMITE');
      }
      if (cuenta.saldoActual > cuenta.limiteCredito) {
        alertas.push('EXCEDE_LIMITE');
      }
    }

    return alertas;
  }

  async getVentas(cuentaId: string): Promise<GetVentaCuenta[]> {
    return await this.repository.getVentasByCuentaId(cuentaId);
  }

  async getEntregas(cuentaId: string, limit: number = 20, offset: number = 0) {
    return await this.repository.getEntregasByCuentaId(cuentaId, limit, offset);
  }

  async getMovimientos(cuentaId: string, filter: GetMovimientosFilter) {
    return await this.repository.getMovimientosByCuentaId(cuentaId, filter);
  }

  async updateCuenta(id: string, updates: { limiteCredito?: number; estado?: CuentaEstado }) {
    const cuenta = await this.repository.getById(id);
    if (!cuenta) {
      throw createHttpError(404, 'Account not found');
    }

    await this.repository.update(id, {
      limiteCredito: updates.limiteCredito,
      estado: updates.estado,
    });
  }

  async deleteCuenta(id: string): Promise<void> {
    const cuenta = await this.repository.getById(id);
    if (!cuenta) {
      throw createHttpError(404, 'Account not found');
    }

    if (cuenta.saldoActual > 0) {
      throw createHttpError(400, 'Cannot close account with pending balance');
    }

    await this.repository.delete(id);
  }

  async ajustarSaldo(
    cuentaId: string,
    monto: number,
    tipo: 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO',
    descripcion: string
  ): Promise<Movimiento> {
    const cuenta = await this.repository.getById(cuentaId);
    if (!cuenta) {
      throw createHttpError(404, 'Account not found');
    }

    const saldoAnterior = cuenta.saldoActual;
    const saldoNuevo = tipo === 'AJUSTE_POSITIVO' 
      ? saldoAnterior + monto 
      : Math.max(0, saldoAnterior - monto);

    await this.repository.update(cuentaId, {
      saldoActual: saldoNuevo,
      totalComprado: tipo === 'AJUSTE_POSITIVO' ? cuenta.totalComprado + monto : cuenta.totalComprado,
    });

    const movimientoId = await this.repository.createMovimiento({
      cuentaId,
      tipo,
      monto: tipo === 'AJUSTE_POSITIVO' ? monto : -monto,
      saldoAnterior,
      saldoNuevo,
      descripcion,
    });

    const movimientos = await this.repository.getMovimientosByCuentaId(cuentaId, {
      limit: 1,
      offset: 0,
    });

    if (!movimientos.data || movimientos.data.length === 0) {
      throw createHttpError(500, 'Failed to retrieve movement');
    }

    return movimientos.data[0];
  }

  /**
   * Validates that all deliveries for a sale are complete
   * Returns validation result with details of incomplete deliveries
   */
  private validateEntregasCompletas(venta: GetVentaCuenta): {
    valid: boolean;
    error?: string;
    message?: string;
    entregasIncompletas?: { id: string; cantidadEsperada: number; cantidadEntregada: number; status: string }[];
  } {
    // For now, check if the sale is PENDIENTE or has undelivered balance
    // In a full implementation, this would check individual delivery records
    const undeliveredAmount = venta.montoPendiente;

    if (undeliveredAmount > 0) {
      return {
        valid: false,
        error: 'ENTREGAS_INCOMPLETAS',
        message: `No se puede pagar: faltan $${undeliveredAmount} pendientes por entregar`,
        entregasIncompletas: [
          {
            id: venta.id,
            cantidadEsperada: 1,
            cantidadEntregada: 0,
            status: 'PENDIENTE',
          },
        ],
      };
    }

    return { valid: true };
  }

  /**
   * Mark a sale as paid (PAGADA)
   * When fully paid, updates fechaVenta to today's date
   */
  async pagarVenta(cuentaId: string, ventaId: string, marcarFechaVenta: boolean = true): Promise<GetVentaCuenta> {
    // Validate cuenta exists
    const cuenta = await this.repository.getById(cuentaId);
    if (!cuenta) {
      throw createHttpError(404, 'Cuenta no encontrada');
    }

    // Get the sale
    const venta = await this.repository.getVentaCuentaById(ventaId);
    if (!venta) {
      throw createHttpError(404, 'Venta no encontrada');
    }

    // Validate that the sale belongs to this account
    if (venta.cuentaId !== cuentaId) {
      throw createHttpError(400, 'Venta no pertenece a esta cuenta');
    }

    // Validate all deliveries are complete
    const validation = this.validateEntregasCompletas(venta);
    if (!validation.valid) {
      const error = createHttpError(400, validation.message || 'Entregas incompletas');
      (error as any).data = {
        error: validation.error,
        entregasIncompletas: validation.entregasIncompletas,
      };
      throw error;
    }

    // Build update data - if marcaFechaVenta, update fechaVenta to today
    const updateData: { montoEntregado: number; montoPendiente: number; estado: VentaCuentaEstado; fechaVenta?: Date } = {
      montoEntregado: venta.montoTotal,
      montoPendiente: 0,
      estado: 'PAGADA',
    };

    // When marking as paid (completing), update fechaVenta to payment date
    if (marcarFechaVenta) {
      updateData.fechaVenta = new Date();
    }

    // Mark sale as PAGADA
    await this.repository.updateVentaCuenta(ventaId, updateData);

    // Create movement record
    await this.repository.createMovimiento({
      cuentaId,
      tipo: 'ENTREGA',
      referenciaId: ventaId,
      referenciaTipo: 'VENTA',
      monto: -venta.montoTotal,
      saldoAnterior: cuenta.saldoActual,
      saldoNuevo: Math.max(0, cuenta.saldoActual - venta.montoTotal),
      descripcion: `Pago de venta ${venta.ventaId}`,
    });

    // Update account balance
    const nuevoTotalEntregado = cuenta.totalEntregado + venta.montoTotal;
    const nuevoSaldoActual = Math.max(0, cuenta.totalComprado - nuevoTotalEntregado);
    const nuevoEstado = this.calcularEstado(nuevoSaldoActual, cuenta.limiteCredito);

    await this.repository.update(cuentaId, {
      totalEntregado: nuevoTotalEntregado,
      saldoActual: nuevoSaldoActual,
      estado: nuevoEstado,
    });

    // Return updated venta
    const ventaActualizada = await this.repository.getVentaCuentaById(ventaId);
    if (!ventaActualizada) {
      throw createHttpError(500, 'Failed to retrieve updated sale');
    }

    return ventaActualizada;
  }

  /**
   * Saldar Todo - Pay all pending sales in a single operation
   * Creates one entrega with FIFO allocation across all pending ventas
   * Marks account as SALDADA and updates all fully paid ventas to today's date
   */
  async saldarTodo(
    cuentaId: string,
    metodoPago: MetodoPago,
    descripcion?: string,
    createdBy?: string
  ): Promise<{ entrega: Entrega; ventasPagadas: GetVentaCuenta[] }> {
    const cuenta = await this.repository.getById(cuentaId);
    if (!cuenta) {
      throw createHttpError(404, 'Cuenta no encontrada');
    }

    if (cuenta.saldoActual <= 0) {
      throw createHttpError(400, 'La cuenta ya está saldada');
    }

    // Get all pending ventas
    const ventas = await this.repository.getVentasByCuentaId(cuentaId);
    const ventasPendientes = ventas
      .filter(v => v.estado !== 'PAGADA' && v.estado !== 'DESESTIMADA')
      .sort((a, b) => new Date(a.fechaVenta).getTime() - new Date(b.fechaVenta).getTime());

    if (ventasPendientes.length === 0) {
      throw createHttpError(400, 'No hay ventas pendientes');
    }

    const montoTotal = cuenta.saldoActual;
    const hoy = new Date();
    const ventasPagadas: GetVentaCuenta[] = [];

    // Apply payment using FIFO
    const detalleAplicacion = this.aplicarFIFO(ventasPendientes, montoTotal);

    // Update each venta and track fully paid ones
    for (const aplicacion of detalleAplicacion) {
      const venta = ventasPendientes.find(v => v.id === aplicacion.ventaId);
      if (!venta) continue;

      const nuevoMontoEntregado = venta.montoEntregado + aplicacion.montoAplicado;
      const nuevoMontoPendiente = Math.max(0, venta.montoPendiente - aplicacion.montoAplicado);
      const nuevoEstado = this.calcularVentaEstado(nuevoMontoEntregado, venta.montoTotal);

      // If fully paid, update fechaVenta to today
      const updateData: { montoEntregado: number; montoPendiente: number; estado: VentaCuentaEstado; fechaVenta?: Date } = {
        montoEntregado: nuevoMontoEntregado,
        montoPendiente: nuevoMontoPendiente,
        estado: nuevoEstado,
      };

      if (nuevoEstado === 'PAGADA') {
        updateData.fechaVenta = hoy;
      }

      await this.repository.updateVentaCuenta(venta.id, updateData);

      // Track fully paid ventas
      if (nuevoEstado === 'PAGADA') {
        // Update createdat in sales table so the sale appears as today's sale in /ventas and /caja
        await this.repository.updateSaleDate(venta.ventaId || venta.id, hoy);

        const ventaActualizada = await this.repository.getVentaCuentaById(venta.id);
        if (ventaActualizada) {
          ventasPagadas.push(ventaActualizada);
        }
      }
    }

    // Update account - mark as SALDADA
    await this.repository.update(cuentaId, {
      totalEntregado: cuenta.totalComprado,
      saldoActual: 0,
      estado: 'SALDADA',
    });

    // Create single entrega for the full amount
    const entregaId = await this.repository.createEntrega({
      cuentaId,
      monto: montoTotal,
      metodoPago,
      descripcion: descripcion || 'Saldar todo',
      detalleAplicacion,
      createdBy,
      cantidadEsperada: 1,
      cantidadEntregada: 1,
      status: 'COMPLETA',
    });

    // Create movement
    await this.repository.createMovimiento({
      cuentaId,
      tipo: 'ENTREGA',
      referenciaId: entregaId,
      referenciaTipo: 'ENTREGA',
      monto: -montoTotal,
      saldoAnterior: cuenta.saldoActual,
      saldoNuevo: 0,
      descripcion: descripcion || 'Saldar todo',
    });

    // Get the created entrega
    const entregas = await this.repository.getEntregasByCuentaId(cuentaId, 1, 0);
    if (!entregas.data || entregas.data.length === 0) {
      throw createHttpError(500, 'Failed to retrieve entrega');
    }

    return {
      entrega: entregas.data[0],
      ventasPagadas,
    };
  }

  /**
   * Pagar multiple specific ventas (partial or full)
   * Allocates payment amount across selected ventas using FIFO
   */
  async pagarVentas(
    cuentaId: string,
    ventaIds: string[],
    monto: number,
    metodoPago: MetodoPago,
    descripcion?: string,
    createdBy?: string
  ): Promise<{ entrega: Entrega; ventasActualizadas: GetVentaCuenta[] }> {
    const cuenta = await this.repository.getById(cuentaId);
    if (!cuenta) {
      throw createHttpError(404, 'Cuenta no encontrada');
    }

    if (monto <= 0) {
      throw createHttpError(400, 'El monto debe ser mayor a 0');
    }

    if (monto > cuenta.saldoActual) {
      throw createHttpError(400, `El monto excede el saldo pendiente de $${cuenta.saldoActual}`);
    }

    // Get all pending ventas for this cuenta
    const todasVentas = await this.repository.getVentasByCuentaId(cuentaId);
    const ventasPendientes = todasVentas
      .filter(v => v.estado !== 'PAGADA' && v.estado !== 'DESESTIMADA')
      .sort((a, b) => new Date(a.fechaVenta).getTime() - new Date(b.fechaVenta).getTime());

    // Filter only the requested ventas
    const ventasSeleccionadas = ventasPendientes.filter(v => ventaIds.includes(v.id));

    if (ventasSeleccionadas.length === 0) {
      throw createHttpError(400, 'No se encontraron ventas pendientes para pagar');
    }

    const hoy = new Date();
    const ventasActualizadas: GetVentaCuenta[] = [];

    // Apply payment using FIFO among selected ventas
    const detalleAplicacion = this.aplicarFIFO(ventasSeleccionadas, monto);

    // Update each venta
    for (const aplicacion of detalleAplicacion) {
      const venta = ventasSeleccionadas.find(v => v.id === aplicacion.ventaId);
      if (!venta) continue;

      const nuevoMontoEntregado = venta.montoEntregado + aplicacion.montoAplicado;
      const nuevoMontoPendiente = Math.max(0, venta.montoPendiente - aplicacion.montoAplicado);
      const nuevoEstado = this.calcularVentaEstado(nuevoMontoEntregado, venta.montoTotal);

      const updateData: { montoEntregado: number; montoPendiente: number; estado: VentaCuentaEstado; fechaVenta?: Date } = {
        montoEntregado: nuevoMontoEntregado,
        montoPendiente: nuevoMontoPendiente,
        estado: nuevoEstado,
      };

      // If fully paid, update fechaVenta to today
      if (nuevoEstado === 'PAGADA') {
        updateData.fechaVenta = hoy;
      }

      await this.repository.updateVentaCuenta(venta.id, updateData);

      const ventaActualizada = await this.repository.getVentaCuentaById(venta.id);
      if (ventaActualizada) {
        ventasActualizadas.push(ventaActualizada);
      }
    }

    // Update account balance
    const nuevoTotalEntregado = cuenta.totalEntregado + monto;
    const nuevoSaldoActual = Math.max(0, cuenta.totalComprado - nuevoTotalEntregado);
    const nuevoEstado = this.calcularEstado(nuevoSaldoActual, cuenta.limiteCredito);

    await this.repository.update(cuentaId, {
      totalEntregado: nuevoTotalEntregado,
      saldoActual: nuevoSaldoActual,
      estado: nuevoEstado,
    });

    // Create entrega
    const entregaId = await this.repository.createEntrega({
      cuentaId,
      monto,
      metodoPago,
      descripcion: descripcion || 'Pago parcial',
      detalleAplicacion,
      createdBy,
      cantidadEsperada: 1,
      cantidadEntregada: 1,
      status: monto === nuevoSaldoActual ? 'COMPLETA' : 'PARCIAL',
    });

    // Create movement
    await this.repository.createMovimiento({
      cuentaId,
      tipo: 'ENTREGA',
      referenciaId: entregaId,
      referenciaTipo: 'ENTREGA',
      monto: -monto,
      saldoAnterior: cuenta.saldoActual,
      saldoNuevo: nuevoSaldoActual,
      descripcion: descripcion || 'Pago parcial',
    });

    // Get the created entrega
    const entregas = await this.repository.getEntregasByCuentaId(cuentaId, 1, 0);
    if (!entregas.data || entregas.data.length === 0) {
      throw createHttpError(500, 'Failed to retrieve entrega');
    }

    return {
      entrega: entregas.data[0],
      ventasActualizadas,
    };
  }
}
