import { Router } from 'express'; 

// import { authMiddleware } from '../../middlewares';
import { ArcaController } from '../../controllers/ArcaController';

const router = Router();

// router.use(authMiddleware); 

router.post('/', ArcaController.postBill); 
router.post('/:id', ArcaController.sendBill);

export default router;
