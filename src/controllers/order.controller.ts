import { Request, Response } from 'express';
import { OrderService } from '../services/order.service';
import { OrderRepository } from '../repositories/order.repository';
import { PaymentService } from '../services/payment.service';

const orderService = new OrderService();
const orderRepo = new OrderRepository();
const paymentService = new PaymentService()

export class OrderController {
  // 1. Pesanan Manual oleh Staf/Kasir
  async create(req: Request, res: Response) {
    try {
      const { items } = req.body;
      const userId = req.user?.id; // Diambil dari token JWT

      if (!items || items.length === 0) throw new Error("Pesanan tidak boleh kosong");

      const order = await orderService.createOrder(userId!, items);
      res.status(201).json({ success: true, data: order });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // 2. Pesanan Mandiri oleh Pelanggan (Public)
  async createFromCustomer(req: Request, res: Response) {
    try {
      const { tableNumber, items } = req.body;

      if (!tableNumber || !items) throw new Error("Data tidak lengkap");

      // 1. Simpan order ke database (status masih PENDING)
      const order = await orderService.createCustomerOrder(tableNumber, items);

      // 2. Buat transaksi di Midtrans
      const midtransTx = await paymentService.createTransaction(order);

      // 3. Kirim balik token & link pembayaran ke HP pelanggan
      res.status(201).json({ 
        success: true, 
        message: "Silahkan selesaikan pembayaran",
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          total: order.totalAmount,
          snapToken: midtransTx.token, // Digunakan kalau pakai Snap Popup
          paymentUrl: midtransTx.redirect_url // Link halaman pembayaran
        }
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // 3. Selesaikan Pembayaran (PENDING -> PAID)
  async pay(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (typeof id !== 'string') {
        return res.status(400).json({ success: false, message: "ID harus berupa string" });
      }

      const order = await orderService.markAsPaid(id, userId!);
      res.status(200).json({ 
        success: true, 
        message: "Pembayaran berhasil diproses", 
        data: order 
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // 4. Pembatalan Order (Hanya Admin/Owner)
  async cancel(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const order = await orderService.cancelOrder(id as string);
      res.status(200).json({ 
        success: true, 
        message: "Order dibatalkan dan stok dikembalikan", 
        data: order 
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // 5. List dan Detail (Menggunakan Repository)
  async list(req: Request, res: Response) {
    const orders = await orderRepo.findAll();
    res.json({ success: true, data: orders });
  }

  async detail(req: Request, res: Response) {
    try {
      const order = await orderRepo.findById(req.params.id as string);
      if (!order) return res.status(404).json({ success: false, message: "Order tidak ditemukan" });
      res.json({ success: true, data: order });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}