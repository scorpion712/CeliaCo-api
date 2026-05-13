import { Request, Response, NextFunction } from 'express';
import { createCuentaHandler } from '../handlers/cuentas/create/createCuenta.handler';
import { getCuentasHandler } from '../handlers/cuentas/get/getCuentas.handler';
import { getCuentaByIdHandler } from '../handlers/cuentas/get/getCuentaById.handler';
import { registerEntregaHandler } from '../handlers/cuentas/registerEntrega/registerEntrega.handler';
import { getMovimientosHandler } from '../handlers/cuentas/get/getMovimientos.handler';
import { getVentasHandler } from '../handlers/cuentas/get/getVentas.handler';
import { getEntregasHandler } from '../handlers/cuentas/get/getEntregas.handler';
import { updateCuentaHandler } from '../handlers/cuentas/update/updateCuenta.handler';
import { pagarVentaHandler } from '../handlers/cuentas/pagar/pagarVenta.handler';
import { saldarTodoHandler } from '../handlers/cuentas/saldarTodo/saldarTodo.handler';
import { pagarVentasHandler } from '../handlers/cuentas/pagar/pagarVentas.handler';
import { cuentaCorrienteService } from '../services/instances';
import {
  adaptCreateCuenta,
  adaptGetCuentas,
  adaptGetCuentaById,
  adaptRegistrarEntrega,
  adaptGetMovimientos,
  adaptUpdateCuenta,
  adaptPagarVenta,
  adaptSaldarTodo,
  adaptPagarVentas,
} from '../adapters/request/cuentas';
import {
  adaptGetCuentasResponse,
  adaptGetCuentaByIdResponse,
  adaptRegistrarEntregaResponse,
  adaptGetMovimientosResponse,
  adaptGetVentasResponse,
  adaptGetEntregasResponse,
  adaptPagarVentaResponse,
  adaptPagarVentaErrorResponse,
  adaptSaldarTodoResponse,
  adaptPagarVentasResponse,
} from '../adapters/response/cuentas';
import createHttpError from 'http-errors';

export const CuentasController = {
  createCuenta: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const command = adaptCreateCuenta(req);
      const result = await createCuentaHandler(command);
      
      res.status(201).json(result.cuenta);
    } catch (error) {
      next(error);
    }
  },

  getCuentas: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const command = adaptGetCuentas(req);
      const result = await getCuentasHandler(command);
      
      const response = adaptGetCuentasResponse(result.cuentas);
      res.json(response);
    } catch (error) {
      next(error);
    }
  },

  getCuentaById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const command = adaptGetCuentaById(req);
      const result = await getCuentaByIdHandler(command);
      
      const ventas = await cuentaCorrienteService.getVentas(command.id);
      const entregas = await cuentaCorrienteService.getEntregas(command.id, 10, 0);
      const movimientos = await cuentaCorrienteService.getMovimientos(command.id, { limit: 20, offset: 0 });
      const ultimaEntrega = entregas && entregas.data && entregas.data.length > 0 
        ? { fecha: entregas.data[0].createdAt, monto: entregas.data[0].monto }
        : undefined;
      
      const response = adaptGetCuentaByIdResponse(
        result.cuenta, 
        ventas, 
        entregas?.data || [], 
        movimientos?.data || [],
        ultimaEntrega
      );
      res.json(response);
    } catch (error) {
      next(error);
    }
  },

  getCuentaByClienteId: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cuenta = await cuentaCorrienteService.getCuentaByClienteId(req.params.clienteId as string);
      
      if (!cuenta) {
        throw createHttpError(404, 'Account not found for this client');
      }
      
      res.json(cuenta);
    } catch (error) {
      next(error);
    }
  },

  registrarEntrega: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const command = adaptRegistrarEntrega(req);
      const result = await registerEntregaHandler(command);
      
      const response = adaptRegistrarEntregaResponse(result.entrega);
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  },

  getMovimientos: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const command = adaptGetMovimientos(req);
      const result = await getMovimientosHandler(command);
      
      const response = adaptGetMovimientosResponse(
        result.movimientos.data,
        result.movimientos.total,
        command.limit ?? 20,
        command.offset ?? 0
      );
      res.json(response);
    } catch (error) {
      next(error);
    }
  },

  getVentas: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getVentasHandler({ cuentaId: req.params.id as string });
      
      const response = adaptGetVentasResponse(result.ventas);
      res.json(response);
    } catch (error) {
      next(error);
    }
  },

  getEntregas: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
      
      const result = await getEntregasHandler({ cuentaId: req.params.id as string, limit, offset });
      
      const response = adaptGetEntregasResponse(
        result.entregas.data,
        result.entregas.total,
        limit,
        offset
      );
      res.json(response);
    } catch (error) {
      next(error);
    }
  },

  updateCuenta: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const command = adaptUpdateCuenta(req);
      const result = await updateCuentaHandler(command);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  deleteCuenta: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await cuentaCorrienteService.deleteCuenta(req.params.id as string);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  ajustarSaldo: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { monto, tipo, descripcion } = req.body;
      
      if (!monto || !tipo || !descripcion) {
        throw createHttpError(400, 'Missing parameters: monto, tipo, descripcion');
      }
      
      if (!['AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO'].includes(tipo)) {
        throw createHttpError(400, 'Tipo must be AJUSTE_POSITIVO or AJUSTE_NEGATIVO');
      }
      
      const movimiento = await cuentaCorrienteService.ajustarSaldo(
        req.params.id as string,
        monto,
        tipo,
        descripcion
      );
      
      res.json(movimiento);
    } catch (error) {
      next(error);
    }
  },

  pagarVenta: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const command = adaptPagarVenta(req);
      const result = await pagarVentaHandler(command);
      
      const response = adaptPagarVentaResponse(result.venta);
      res.status(200).json(response);
    } catch (error: any) {
      // Handle validation error with custom data
      if (error.status === 400 && error.data?.error === 'ENTREGAS_INCOMPLETAS') {
        const response = adaptPagarVentaErrorResponse(
          error.data.error,
          error.message,
          error.data.entregasIncompletas
        );
        return res.status(400).json(response);
      }
      
      next(error);
    }
  },

  saldarTodo: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const command = adaptSaldarTodo(req);
      const result = await saldarTodoHandler(command);
      
      const response = adaptSaldarTodoResponse(result.entrega, result.ventasPagadas);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },

  pagarVentas: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const command = adaptPagarVentas(req);
      const result = await pagarVentasHandler(command);
      
      const response = adaptPagarVentasResponse(result.entrega, result.ventasActualizadas);
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  },
};
