"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const menu_routes_1 = __importDefault(require("./routes/menu.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Daftarkan route
app.use('/api/users', user_routes_1.default);
app.use('/menus', menu_routes_1.default);
app.use('/categories', category_routes_1.default);
const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
