// src/controllers/payment.controller.ts
import { Request, Response } from 'express';
import { OrderService } from '../services/order.service';
import crypto from 'crypto';

const orderService = new OrderService();

export class PaymentController {
  async notification(req: Request, res: Response) {
    const data = req.body;

    // 1. Verifikasi Signature (SANGAT PENTING agar tidak bisa dihack)
    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    const signatureString = data.order_id + data.status_code + data.gross_amount + serverKey;
    const hashed = crypto.createHash('sha512').update(signatureString).digest('hex');

    if (hashed !== data.signature_key) {
      return res.status(403).json({ message: "Signature tidak valid!" });
    }

    const orderNumber = data.order_id;
    const transactionStatus = data.transaction_status;

    console.log(`Log Midtrans: Order ${orderNumber} adalah ${transactionStatus}`);

    // 2. Arahkan ke fungsi Service yang sesuai
    try {
      if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
        // Pembayaran Berhasil
        await orderService.handlePaymentSuccess(orderNumber);
      } else if (transactionStatus === 'expire' || transactionStatus === 'cancel' || transactionStatus === 'deny') {
        // Pembayaran Gagal/Expired, kembalikan stok
        await orderService.handlePaymentExpired(orderNumber);
      }

      res.status(200).json({ message: 'OK' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}