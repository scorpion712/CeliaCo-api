import { Router } from 'express';
import { CuentasController } from '../../controllers';

const router = Router();

router.post('/', CuentasController.createCuenta);
router.get('/', CuentasController.getCuentas);
router.get('/cliente/:clienteId', CuentasController.getCuentaByClienteId);
router.get('/:id', CuentasController.getCuentaById);
router.patch('/:id', CuentasController.updateCuenta);
router.delete('/:id', CuentasController.deleteCuenta);
router.post('/:id/entregas', CuentasController.registrarEntrega);
router.get('/:id/entregas', CuentasController.getEntregas);
router.get('/:id/movimientos', CuentasController.getMovimientos);
router.get('/:id/ventas', CuentasController.getVentas);
router.post('/:id/ajuste', CuentasController.ajustarSaldo);
router.post('/:id/pagar/:ventaId', CuentasController.pagarVenta);
router.post('/:id/saldar-todo', CuentasController.saldarTodo);
router.post('/:id/pagar-ventas', CuentasController.pagarVentas);

export default router;
