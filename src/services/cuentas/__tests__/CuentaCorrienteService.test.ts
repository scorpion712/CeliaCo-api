/**
 * Unit Tests for CuentaCorrienteService Payment Methods
 * 
 * These tests validate:
 * 1. pagarVenta - individual sale payment with fechaVenta update
 * 2. saldarTodo - complete account settlement
 * 3. pagarVentas - multiple sales payment with FIFO allocation
 * 4. Balance updates across all scenarios
 * 5. fechaVenta updates when sales are fully paid
 */

import { CuentaCorrienteService } from '../CuentaCorriente.service';
import { ICuentasCorrientesRepository } from '../../../repositories/cuentas/ICuentasCorrientesRepository.interface';
import { GetVentaCuenta } from '../../../repositories/cuentas/models/GetVentaCuenta';
import { GetCuenta, GetCuentaWithCliente } from '../../../repositories/cuentas/models/GetCuenta';
import createHttpError from 'http-errors';

// Helper to create cuenta for tests
const createTestCuenta = (overrides: Partial<GetCuentaWithCliente> = {}): GetCuentaWithCliente => ({
  id: 'cuenta-1',
  clienteId: 'cliente-1',
  estado: 'ACTIVA',
  totalComprado: 1000,
  totalEntregado: 0,
  saldoActual: 1000,
  limiteCredito: 5000,
  createdAt: new Date(),
  updatedAt: new Date(),
  cliente: {
    id: 'cliente-1',
    nombre: 'Test Cliente',
    telefono: '+5491112345678',
  },
  ...overrides,
});

// Helper to create venta for tests
const createTestVenta = (overrides: Partial<GetVentaCuenta> = {}): GetVentaCuenta => ({
  id: 'venta-1',
  cuentaId: 'cuenta-1',
  ventaId: 'venta-original-1',
  montoTotal: 1000,
  montoEntregado: 0,
  montoPendiente: 1000,
  estado: 'PENDIENTE',
  fechaVenta: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Mock repository with tracking
class MockCuentasCorrientesRepository implements ICuentasCorrientesRepository {
  private ventas: Map<string, GetVentaCuenta> = new Map();
  private cuentas: Map<string, GetCuentaWithCliente> = new Map();
  private entregas: any[] = [];
  private movimientos: any[] = [];
  private updatedVentas: Map<string, any> = new Map();

  setVenta(venta: GetVentaCuenta) {
    this.ventas.set(venta.id, { ...venta });
  }

  setCuenta(cuenta: GetCuentaWithCliente) {
    this.cuentas.set(cuenta.id, { ...cuenta });
  }

  addEntrega(entrega: any) {
    this.entregas.push({ ...entrega });
  }

  async create(): Promise<string> {
    return 'new-id';
  }

  async getById(id: string): Promise<GetCuentaWithCliente | null> {
    return this.cuentas.get(id) || null;
  }

  async getByClienteId(): Promise<any> {
    return null;
  }

  async getAll(): Promise<any> {
    return { data: [], pagination: {} };
  }

  async update(id: string, cuenta: any): Promise<void> {
    const existing = this.cuentas.get(id);
    if (existing) {
      this.cuentas.set(id, { ...existing, ...cuenta });
    }
  }

  async delete(): Promise<void> {}

  async createVentaCuenta(): Promise<string> {
    return 'venta-id';
  }

  async getVentasByCuentaId(cuentaId: string): Promise<any[]> {
    return Array.from(this.ventas.values()).filter(v => v.cuentaId === cuentaId);
  }

  async getVentaCuentaById(id: string): Promise<GetVentaCuenta | null> {
    return this.ventas.get(id) || null;
  }

  async updateVentaCuenta(id: string, data: any): Promise<void> {
    const venta = this.ventas.get(id);
    if (venta) {
      this.updatedVentas.set(id, { ...data });
      this.ventas.set(id, { ...venta, ...data });
    }
  }

  async createEntrega(entrega: any): Promise<string> {
    const id = 'entrega-' + Date.now();
    this.addEntrega({ id, ...entrega });
    return id;
  }

  async getEntregasByCuentaId(): Promise<any> {
    return { data: this.entregas, total: this.entregas.length };
  }

  async createMovimiento(movimiento: any): Promise<string> {
    this.movimientos.push(movimiento);
    return 'movimiento-id';
  }

  async getMovimientosByCuentaId(): Promise<any> {
    return { data: this.movimientos, total: this.movimientos.length };
  }

  getAllMovimientos(): any[] {
    return this.movimientos;
  }

  getUpdatedVenta(id: string): any {
    return this.updatedVentas.get(id);
  }

  reset() {
    this.ventas.clear();
    this.cuentas.clear();
    this.entregas = [];
    this.movimientos = [];
    this.updatedVentas.clear();
  }
}

describe('CuentaCorrienteService Payment Methods', () => {
  let service: CuentaCorrienteService;
  let repository: MockCuentasCorrientesRepository;

  beforeEach(() => {
    repository = new MockCuentasCorrientesRepository();
    service = new CuentaCorrienteService(repository);
  });

  afterEach(() => {
    repository.reset();
  });

  // ============================================================
  // TEST: pagarVenta - Updates fechaVenta when sale is fully paid
  // NOTE: These tests use ventas that are already paid (montoPendiente=0)
  // because validateEntregasCompletas blocks payment if there's pending balance
  // ============================================================
  describe('pagarVenta', () => {
    it('debe actualizar fechaVenta a la fecha actual cuando se paga completamente', async () => {
      // Arrange - venta already paid (montoPendiente=0 passes validation)
      const cuenta = createTestCuenta({
        totalComprado: 1000,
        totalEntregado: 0,
        saldoActual: 1000,
      });

      const venta = createTestVenta({
        montoTotal: 1000,
        montoEntregado: 1000, // Already paid
        montoPendiente: 0, // No pending = passes validation
        estado: 'PAGADA',
        fechaVenta: new Date('2026-05-01'),
      });

      repository.setCuenta(cuenta);
      repository.setVenta(venta);

      // Act
      const result = await service.pagarVenta('cuenta-1', 'venta-1', true);

      // Assert
      expect(result.estado).toBe('PAGADA');
      expect(result.montoEntregado).toBe(1000);
      expect(result.montoPendiente).toBe(0);
      
      // fechaVenta should be updated to today
      const updatedVenta = repository.getUpdatedVenta('venta-1');
      expect(updatedVenta.fechaVenta).toBeDefined();
      expect(new Date(updatedVenta.fechaVenta).toDateString()).toBe(new Date().toDateString());
    });

    it('debe NO actualizar fechaVenta si marcarFechaVenta es false', async () => {
      // Arrange
      const originalFechaVenta = new Date('2026-05-01');
      const cuenta = createTestCuenta();
      const venta = createTestVenta({
        montoEntregado: 1000,
        montoPendiente: 0,
        estado: 'PAGADA',
        fechaVenta: originalFechaVenta,
      });

      repository.setCuenta(cuenta);
      repository.setVenta(venta);

      // Act
      const result = await service.pagarVenta('cuenta-1', 'venta-1', false);

      // Assert
      const updatedVenta = repository.getUpdatedVenta('venta-1');
      expect(updatedVenta.fechaVenta).toBeUndefined();
    });

    it('debe actualizar balance de cuenta correctamente', async () => {
      // Arrange - venta already paid
      const cuenta = createTestCuenta({
        totalComprado: 1000,
        totalEntregado: 0,
        saldoActual: 1000,
      });
      const venta = createTestVenta({
        montoTotal: 1000,
        montoEntregado: 1000,
        montoPendiente: 0,
        estado: 'PAGADA',
      });

      repository.setCuenta(cuenta);
      repository.setVenta(venta);

      // Act
      await service.pagarVenta('cuenta-1', 'venta-1');

      // Assert - verify cuenta was updated
      const updatedCuenta = await repository.getById('cuenta-1');
      expect(updatedCuenta!.totalEntregado).toBe(1000);
      expect(updatedCuenta!.saldoActual).toBe(0);
      expect(updatedCuenta!.estado).toBe('SALDADA');
    });
  });

  // ============================================================
  // TEST: saldarTodo - Complete account settlement
  // ============================================================
  describe('saldarTodo', () => {
    it('debe saldar todas las ventas pendientes y marcar cuenta como SALDADA', async () => {
      // Arrange
      const cuenta = createTestCuenta({
        totalComprado: 5000,
        totalEntregado: 1000,
        saldoActual: 4000,
      });

      const venta1 = createTestVenta({
        id: 'venta-1',
        montoTotal: 2000,
        montoEntregado: 0,
        montoPendiente: 2000,
        estado: 'PENDIENTE',
        fechaVenta: new Date('2026-05-01'),
      });

      const venta2 = createTestVenta({
        id: 'venta-2',
        montoTotal: 3000,
        montoEntregado: 1000,
        montoPendiente: 2000,
        estado: 'PAGO_PARCIAL',
        fechaVenta: new Date('2026-05-05'),
      });

      repository.setCuenta(cuenta);
      repository.setVenta(venta1);
      repository.setVenta(venta2);

      // Act
      const result = await service.saldarTodo('cuenta-1', 'EFECTIVO', 'Saldar todo');

      // Assert
      expect(result.entrega.monto).toBe(4000);
      expect(result.entrega.metodoPago).toBe('EFECTIVO');

      // Verify account is SALDADA
      const updatedCuenta = await repository.getById('cuenta-1');
      expect(updatedCuenta!.estado).toBe('SALDADA');
      expect(updatedCuenta!.saldoActual).toBe(0);
      expect(updatedCuenta!.totalEntregado).toBe(5000);
    });

    it('debe rechazar si la cuenta ya esta saldada', async () => {
      // Arrange
      const cuenta = createTestCuenta({
        estado: 'SALDADA',
        totalComprado: 1000,
        totalEntregado: 1000,
        saldoActual: 0,
      });

      repository.setCuenta(cuenta);

      // Act & Assert
      await expect(service.saldarTodo('cuenta-1', 'EFECTIVO'))
        .rejects.toThrow('La cuenta ya está saldada');
    });

    it('debe rechazar si no hay ventas pendientes', async () => {
      // Arrange
      const cuenta = createTestCuenta({
        totalComprado: 1000,
        totalEntregado: 0,
        saldoActual: 1000,
      });

      repository.setCuenta(cuenta);

      // Act & Assert
      await expect(service.saldarTodo('cuenta-1', 'EFECTIVO'))
        .rejects.toThrow('No hay ventas pendientes');
    });
  });

  // ============================================================
  // TEST: pagarVentas - Multiple sales with FIFO allocation
  // ============================================================
  describe('pagarVentas', () => {
    it('debe aplicar pago usando FIFO (mas vieja primero)', async () => {
      // Arrange
      const cuenta = createTestCuenta({
        totalComprado: 5000,
        totalEntregado: 0,
        saldoActual: 5000,
      });

      // Two ventas - venta1 is older
      const venta1 = createTestVenta({
        id: 'venta-1',
        montoTotal: 2000,
        montoEntregado: 0,
        montoPendiente: 2000,
        estado: 'PENDIENTE',
        fechaVenta: new Date('2026-05-01'), // Older
      });

      const venta2 = createTestVenta({
        id: 'venta-2',
        montoTotal: 3000,
        montoEntregado: 0,
        montoPendiente: 3000,
        estado: 'PENDIENTE',
        fechaVenta: new Date('2026-05-10'), // Newer
      });

      repository.setCuenta(cuenta);
      repository.setVenta(venta1);
      repository.setVenta(venta2);

      // Act - Pay $1500, should go to venta1 first (FIFO)
      const result = await service.pagarVentas(
        'cuenta-1',
        ['venta-1', 'venta-2'],
        1500,
        'EFECTIVO'
      );

      // Assert
      expect(result.entrega.monto).toBe(1500);
      
      // Verify venta1 was partially paid
      const updatedVenta1 = repository.getUpdatedVenta('venta-1');
      expect(updatedVenta1.montoEntregado).toBe(1500);
      expect(updatedVenta1.montoPendiente).toBe(500);
      expect(updatedVenta1.estado).toBe('PAGO_PARCIAL');
      
      // Verify venta2 was NOT touched
      const updatedVenta2 = repository.getUpdatedVenta('venta-2');
      expect(updatedVenta2).toBeUndefined();
    });

    it('debe marcar fechaVenta cuando se paga completamente', async () => {
      // Arrange
      const cuenta = createTestCuenta({
        totalComprado: 2000,
        totalEntregado: 0,
        saldoActual: 2000,
      });

      const venta = createTestVenta({
        montoTotal: 2000,
        montoEntregado: 0,
        montoPendiente: 2000,
        estado: 'PENDIENTE',
        fechaVenta: new Date('2026-05-01'),
      });

      repository.setCuenta(cuenta);
      repository.setVenta(venta);

      // Act - Pay exactly the pending amount
      const result = await service.pagarVentas(
        'cuenta-1',
        ['venta-1'],
        2000,
        'EFECTIVO'
      );

      // Assert
      const updatedVenta = repository.getUpdatedVenta('venta-1');
      expect(updatedVenta.estado).toBe('PAGADA');
      expect(updatedVenta.fechaVenta).toBeDefined();
    });

    it('debe rechazar si el monto excede el saldo pendiente', async () => {
      // Arrange
      const cuenta = createTestCuenta({
        totalComprado: 1000,
        totalEntregado: 0,
        saldoActual: 1000,
      });

      repository.setCuenta(cuenta);

      // Act & Assert
      await expect(service.pagarVentas(
        'cuenta-1',
        ['venta-1'],
        1500, // More than pending
        'EFECTIVO'
      )).rejects.toThrow('excede');
    });

    it('debe rechazar si no se encuentran ventas pendientes', async () => {
      // Arrange
      const cuenta = createTestCuenta({
        totalComprado: 1000,
        totalEntregado: 0,
        saldoActual: 1000,
      });

      repository.setCuenta(cuenta);

      // Act & Assert
      await expect(service.pagarVentas(
        'cuenta-1',
        ['venta-inexistente'],
        500,
        'EFECTIVO'
      )).rejects.toThrow('No se encontraron ventas pendientes');
    });
  });

  // ============================================================
  // TEST: Balance consistency with pagarVentas
  // NOTE: Use pagarVentas as it doesn't have entrega validation
  // ============================================================
  describe('Balance Consistency', () => {
    it('debe mantener consistencia despues de pagar', async () => {
      // Arrange
      const cuenta = createTestCuenta({
        totalComprado: 2000,
        totalEntregado: 0,
        saldoActual: 2000,
      });

      const venta = createTestVenta({
        montoTotal: 2000,
        montoEntregado: 0,
        montoPendiente: 2000,
        estado: 'PENDIENTE',
      });

      repository.setCuenta(cuenta);
      repository.setVenta(venta);

      // Act - Pay $500 partial
      await service.pagarVentas('cuenta-1', ['venta-1'], 500, 'EFECTIVO');

      // Assert
      const updatedCuenta = await repository.getById('cuenta-1');
      expect(updatedCuenta!.totalEntregado).toBe(500);
      expect(updatedCuenta!.saldoActual).toBe(1500); // 2000 - 500
      expect(updatedCuenta!.totalComprado).toBe(2000);
    });

    it('debe crear movimiento de tipo ENTREGA por cada pago', async () => {
      // Arrange
      const cuenta = createTestCuenta({
        totalComprado: 1000,
        totalEntregado: 0,
        saldoActual: 1000,
      });

      const venta = createTestVenta({
        montoTotal: 1000,
        montoEntregado: 0,
        montoPendiente: 1000,
        estado: 'PENDIENTE',
      });

      repository.setCuenta(cuenta);
      repository.setVenta(venta);

      // Act
      await service.pagarVentas('cuenta-1', ['venta-1'], 1000, 'TRANSFERENCIA');

      // Assert
      expect(repository.getAllMovimientos().length).toBeGreaterThan(0);
      expect(repository.getAllMovimientos().some((m: any) => m.tipo === 'ENTREGA')).toBe(true);
    });
  });
});
