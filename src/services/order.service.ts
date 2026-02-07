import { prisma } from '../lib/prisma';

export class OrderService {
  async createOrder(userId: string, items: { menuId: string, qty: number }[]) {
    return await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const orderItemsData = [];

      for (const item of items) {
        const menu = await tx.menu.findUnique({ where: { id: item.menuId } });

        if (!menu || menu.deletedAt) throw new Error(`Menu ${item.menuId} tidak ditemukan`);
        if (menu.stock < item.qty) throw new Error(`Stok ${menu.name} tidak cukup`);

        totalAmount += menu.price * item.qty;

        await tx.menu.update({
          where: { id: menu.id },
          data: { stock: { decrement: item.qty } }
        });

        orderItemsData.push({
          menuId: menu.id,
          qty: item.qty,
          price: menu.price
        });
      }

      return await tx.order.create({
        data: {
          orderNumber: `ORD-${Date.now()}`,
          totalAmount,
          userId, 
          status: 'PAID',
          items: { create: orderItemsData }
        },
        include: { items: true }
      });
    });
  }

  async createCustomerOrder(tableNumber: string, items: { menuId: string, qty: number }[]) {
    return await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const orderItemsData = [];

      for (const item of items) {
        const menu = await tx.menu.findUnique({ where: { id: item.menuId } });
        
        if (!menu || menu.deletedAt) throw new Error(`Menu ${item.menuId} tidak ditemukan`);
        if (menu.stock < item.qty) throw new Error(`Stok ${menu.name} tidak cukup`);

        totalAmount += menu.price * item.qty;

        // Stok tetap dipotong agar tidak terjadi over-order
        await tx.menu.update({
          where: { id: menu.id },
          data: { stock: { decrement: item.qty } }
        });

        orderItemsData.push({
          menuId: menu.id,
          qty: item.qty,
          price: menu.price
        });
      }

      return await tx.order.create({
        data: {
          orderNumber: `CUST-${Date.now()}`,
          tableNumber,
          totalAmount,
          status: 'PENDING',
          items: { create: orderItemsData }
        },
        include: { items: true }
      });
    });
  }

  async markAsPaid(orderId: string, userId: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    
    if (!order) throw new Error("Order tidak ditemukan");
    if (order.status !== 'PENDING') throw new Error("Hanya pesanan PENDING yang bisa dibayar");

    return await prisma.order.update({
      where: { id: orderId },
      data: { 
        status: 'PAID',
        userId: userId 
      }
    });
  }

  async cancelOrder(orderId: string) {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      });

      if (!order) throw new Error("Order tidak ditemukan");
      if (order.status === 'CANCELLED') throw new Error("Order sudah dibatalkan");

      for (const item of order.items) {
        await tx.menu.update({
          where: { id: item.menuId },
          data: { stock: { increment: item.qty } }
        });
      }

      return await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' }
      });
    });
  }

  async handlePaymentSuccess(orderNumber: string) {
    const order = await prisma.order.findUnique({
        where: { orderNumber }
    });

    if (!order) throw new Error("Order tidak ditemukan");
    
    if (order.status === 'PAID') return order;

    return await prisma.order.update({
        where: { orderNumber },
        data: { status: 'PAID' },
        include: { items: { include: { menu: true } } }
    });
  }

  async handlePaymentExpired(orderNumber: string) {
    return await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
        where: { orderNumber },
        include: { items: true }
        });

        if (!order || order.status !== 'PENDING') return;

        // Kembalikan stok
        for (const item of order.items) {
        await tx.menu.update({
            where: { id: item.menuId },
            data: { stock: { increment: item.qty } }
        });
        }

        return await tx.order.update({
        where: { orderNumber },
        data: { status: 'CANCELLED' }
        });
    });
  }
}