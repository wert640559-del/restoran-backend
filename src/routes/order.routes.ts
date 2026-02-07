import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();
const orderCtrl = new OrderController();

router.post('/customer-order', orderCtrl.createFromCustomer);

router.use(authenticate);

router.get('/', authorize(['KASIR', 'ADMIN', 'OWNER']), orderCtrl.list);
router.get('/:id', orderCtrl.detail);

router.post('/', authorize(['KASIR', 'ADMIN', 'OWNER']), orderCtrl.create);

router.put('/:id/pay', authorize(['KASIR', 'ADMIN', 'OWNER']), orderCtrl.pay);

router.put('/:id/cancel', authorize(['ADMIN', 'OWNER']), orderCtrl.cancel);

export default router;