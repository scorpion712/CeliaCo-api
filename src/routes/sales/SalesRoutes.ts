import { Router } from 'express'; 

import { SalesController } from '../../controllers';
import { authMiddleware } from '../../middlewares';

const router = Router();

// router.use(authMiddleware); 

router.post('/', SalesController.createSale);
router.get('/', SalesController.getSales);
router.get('/summary', SalesController.getSalesSummary);
router.get('/diarias', SalesController.getDailySalesByType);
router.get('/:id', SalesController.getSaleById);
router.put('/:id', SalesController.updateSale);
router.delete('/:id', SalesController.deleteSale);

export default router;
