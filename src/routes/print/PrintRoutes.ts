import { Router } from 'express';

// import { PrinterController } from '../../controllers'; // TODO: Implement PrinterController
import { authMiddleware } from '../../middlewares';

const router = Router();

// router.use(authMiddleware);

// router.post('/:id', PrinterController.printTicket); // TODO: Implement

export default router;
