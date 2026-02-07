const midtransClient = require('midtrans-client');

export class PaymentService {
  // Inisialisasi Snap client untuk koneksi ke Midtrans
  private snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY || '',
    clientKey: process.env.MIDTRANS_CLIENT_KEY || ''
  });

  /**
   * Fungsi untuk meminta link pembayaran ke Midtrans
   */
  async createTransaction(order: any) {
    try {
      const parameter = {
        transaction_details: {
          order_id: order.orderNumber, 
          gross_amount: order.totalAmount, 
        },
        credit_card: {
          secure: true
        },
        enabled_payments: ["qris", "bank_transfer", "gopay", "shopeepay"],
        
        customer_details: {
          first_name: "Pelanggan Meja " + (order.tableNumber || "Order"),
        }
      };

      const transaction = await this.snap.createTransaction(parameter);
      
      // Mengembalikan token dan redirect_url (link pembayaran)
      return transaction;
    } catch (error: any) {
      console.error("Midtrans Service Error:", error);
      throw new Error(`Gagal membuat transaksi ke Midtrans: ${error.message}`);
    }
  }
}