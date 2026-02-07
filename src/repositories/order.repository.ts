import { prisma } from '../lib/prisma';

export class OrderRepository {
  // Mengambil semua order (untuk Admin/Owner)
  async findAll() {
    return prisma.order.findMany({
      include: { 
        user: { select: { name: true } },
        items: { include: { menu: { select: { name: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Mengambil detail satu order
  async findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { menu: true } },
        user: { select: { name: true } }
      }
    });
  }

  // Mencari berdasarkan nomor order (untuk pencarian cepat di kasir)
  async findByOrderNumber(orderNumber: string) {
    return prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true }
    });
  }
}