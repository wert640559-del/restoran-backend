import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();
const userController = new UserController();

router.post('/login', userController.login); 

router.get('/me', authenticate, (req, res) => {
  res.json({ success: true, user: req.user });
});


router.post('/register', authenticate, authorize(['OWNER']), userController.register);

router.get('/', authenticate, authorize(['OWNER', 'ADMIN']), userController.list); 
router.delete('/:id', authenticate, authorize(['OWNER', 'ADMIN']), userController.delete);

export default router;