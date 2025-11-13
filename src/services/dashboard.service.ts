import { logger } from "../core/helpers/logger";
import prisma from "../core/utils/prisma";

interface DashboardStats {
  totalApartments: number;
  totalIncome: number;
  verifiedAgents: number;
  totalAgents: number;
  totalBookings: number;
  recentTransactions: RecentTransaction[];
}

interface RecentTransaction {
  id: string;
  amount: number;
  status: string;
  data: Date;
  apartmentName: string;
  agentName: string;
}

interface TransactionDetails {
  id: string;
  year?: number;
  month?: number;
  agentId?: string;
  apartmentId: string;
  apartmentPrice: number;
  duration: number;
  grandtotal: number;
}

class DashboardService {
  constructor() {}

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const [
        totalApartments,
        totalIncomeResult,
        verifiedAgents,
        totalAgents,
        totalBookings,
        recentTransactions,
      ] = await prisma.$transaction([
        prisma.apartment.count(),
        prisma.transaction.aggregate({
          _sum: { amount: true },
          where: { status: "success" },
        }),
        prisma.agent.count({ where: { status: "VERIFIED" } }),
        prisma.agent.count(),
        prisma.transaction.count({
          where: {
            status: "success",
            booking_start_date: { not: null },
          },
        }),
        prisma.transaction.findMany({
          take: 5,
          orderBy: { created_at: "desc" },
          include: {
            apartment: { select: { name: true } },
            agent: { select: { name: true } },
          },
        }),
      ]);

      return {
        totalApartments,
        totalIncome: totalIncomeResult._sum.amount || 0,
        verifiedAgents,
        totalAgents,
        totalBookings,
        recentTransactions: this.formatRecentTransactions(recentTransactions),
      };
    } catch (error) {
      logger.error("Failed to fetch dashboard stats", error);
      throw new Error("Failed to retrieve dashboard statistics");
    }
  }

  async getTransaction(year: number): Promise<TransactionDetails[]> {
    try {
      const transactions = await prisma.transaction.findMany({
        where: { payment_year: year },
        include: {
          apartment: {
            select: {
              id: true,
              price: true,
              name: true,
              address: true,
            },
          },
          agent: {
            select: {
              id: true,
              name: true,
              email: true,
              bank_name: true,
              account_number: true,
            },
          },
        },
      });


      return transactions.map((transaction) => ({
        id: transaction.id,
        year: transaction.payment_year ? transaction.payment_year : 0,
        month: Number(transaction.payment_month),
        agentId: transaction.agent.id,
        apartmentId: transaction.apartment_id,
        apartmentPrice: transaction.apartment.price,
        duration: transaction.duration_days || 0,
        grandtotal: transaction.amount,
      }));
    } catch (error) {
      logger.error({ error }, "Failed to fetch Transaction details");

      throw new Error("Failed to retrieve transaction details");
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private formatRecentTransactions(transactions: any[]): RecentTransaction[] {
    return transactions.map((tx) => ({
      id: tx.id,
      amount: tx.amount,
      status: tx.status,
      data: tx.created_at,
      apartmentName: tx.apartment.name,
      agentName: tx.agent.name,
    }));
  }
}

export default new DashboardService();
