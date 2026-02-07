import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';

const router = Router();
const paymentCtrl = new PaymentController();

router.post('/webhook', paymentCtrl.notification);

export default router;