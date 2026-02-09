// src/controllers/payment.controller.ts
import { Request, Response } from 'express';
import { OrderService } from '../services/order.service';
import crypto from 'crypto';

const orderService = new OrderService();

export class PaymentController {
  async notification(req: Request, res: Response) {
    try {
      const data = req.body;

      // 1. Verifikasi Signature Key
      const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
      const signatureString = data.order_id + data.status_code + data.gross_amount + serverKey;
      const hashed = crypto.createHash('sha512').update(signatureString).digest('hex');

      if (hashed !== data.signature_key) {
        console.error("Warning: Invalid Midtrans Signature!");
        return res.status(403).json({ message: "Signature tidak valid!" });
      }

      const orderNumber = data.order_id;
      const transactionStatus = data.transaction_status;
      const fraudStatus = data.fraud_status;

      console.log(`Midtrans Notification Received: Order ${orderNumber} is ${transactionStatus}`);

      // 2. Handle status transaksi secara spesifik
      if (transactionStatus === 'capture') {
        if (fraudStatus === 'accept') {
          // Sukses untuk Kartu Kredit
          await orderService.handlePaymentSuccess(orderNumber);
        }
      } else if (transactionStatus === 'settlement') {
        // Sukses untuk QRIS, VA, E-wallet (Gopay/ShopeePay)
        await orderService.handlePaymentSuccess(orderNumber);
      } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
        // Transaksi Gagal/Hangus
        await orderService.handlePaymentExpired(orderNumber);
      } else if (transactionStatus === 'pending') {
        // Opsional: Update status di DB menjadi "Awaiting Payment"
        console.log(`Order ${orderNumber} is pending payment.`);
      }

      // 3. Selalu kirim status 200 agar Midtrans tidak mengirim ulang notifikasi
      return res.status(200).json({ status: 'OK' });

    } catch (error: any) {
      console.error("Webhook Error:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  }
}