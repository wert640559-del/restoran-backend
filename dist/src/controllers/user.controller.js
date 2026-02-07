"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const user_service_1 = require("../services/user.service");
const user_repository_1 = require("../repositories/user.repository");
const userService = new user_service_1.UserService();
const userRepository = new user_repository_1.UserRepository();
class UserController {
    async list(req, res) {
        try {
            const users = await userRepository.findAll();
            const safeUsers = users.map(user => {
                const { password, ...userWithoutPassword } = user;
                return userWithoutPassword;
            });
            res.status(200).json({
                success: true,
                data: safeUsers
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: "Gagal mengambil daftar user: " + error.message
            });
        }
    }
    async register(req, res) {
        try {
            const user = await userService.registerUser(req.body);
            // Hilangkan password dari response agar aman
            const { password, ...userResponse } = user;
            res.status(201).json({
                success: true,
                message: "Registrasi berhasil",
                data: userResponse
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const result = await userService.loginUser(email, password);
            res.status(200).json({
                success: true,
                message: "Login berhasil",
                data: result
            });
        }
        catch (error) {
            res.status(401).json({
                success: false,
                message: error.message
            });
        }
    }
    async delete(req, res) {
        try {
            const { id } = req.params;
            if (typeof id !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: "ID tidak valid"
                });
            }
            // 1. Cek apakah user yang mau dihapus ada
            const existingUser = await userRepository.findById(id);
            if (!existingUser) {
                return res.status(404).json({
                    success: false,
                    message: "User tidak ditemukan."
                });
            }
            // 2. Cegah user menghapus dirinya sendiri (Opsional tapi disarankan)
            if (req.user?.id === id) {
                return res.status(400).json({
                    success: false,
                    message: "Anda tidak bisa menghapus akun Anda sendiri melalui endpoint ini."
                });
            }
            // 3. Eksekusi hapus via repository
            await userRepository.softDelete(id);
            res.status(200).json({
                success: true,
                message: `User dengan email ${existingUser.email} berhasil dihapus.`
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: "Gagal menghapus user: " + error.message
            });
        }
    }
}
exports.UserController = UserController;
