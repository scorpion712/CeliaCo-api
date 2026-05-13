import { Router } from 'express'; 

import { PrinterController } from '../../controllers';
import { authMiddleware } from '../../middlewares';

const router = Router();

// router.use(authMiddleware); 

router.post('/:id', PrinterController.printTicket); 

export default router;
