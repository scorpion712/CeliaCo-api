import { Router } from 'express'; 

// import { authMiddleware } from '../../middlewares';
import { CustomersController } from '../../controllers/CustomersController';

const router = Router();

// router.use(authMiddleware); 

router.post('/', CustomersController.createCustomer);
router.get('/', CustomersController.getCustomers); 
router.get('/:id', CustomersController.getCustomerById);
router.put('/:id', CustomersController.updateCustomer);
router.patch('/:id', CustomersController.activateCustomer);
router.delete('/:id', CustomersController.deleteCustomer);

export default router;
