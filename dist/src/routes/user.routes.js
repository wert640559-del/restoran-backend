"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const userController = new user_controller_1.UserController();
router.post('/login', userController.login);
router.get('/me', auth_middleware_1.authenticate, (req, res) => {
    res.json({ success: true, user: req.user });
});
router.post('/register', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['OWNER']), userController.register);
router.get('/', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['OWNER', 'ADMIN']), userController.list);
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(['OWNER', 'ADMIN']), userController.delete);
exports.default = router;
