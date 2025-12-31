import { PayoutStatus } from "@prisma/client";
import prisma from "../core/utils/prisma"
import { uploadImageToSupabase } from "../core/utils/supabase";
import { confirmPayoutMail, rejectPayoutMail } from "../email/notification";

class WalletService {
   async getPayoutRequest() {
  try {
    const payout = await prisma.payout.findMany({
      where: {
        status: { in: ["pending", "rejected"] }, // Updated: Now includes both "pending" and "cancelled"
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
          },
        },
        transaction: {
          select: {
            status: true,
            amount: true,
            agentPercentage: true,
            mockupPrice: true,
            booking_end_date: true,
            booking_start_date: true,
            duration_days: true,
            date_paid: true,
            apartment: { select: { name: true } },
          },
        },
      },
    });
    return payout;
  } catch (error: any) {
    throw new Error(`${error.message}`);
  }
}
  
async getSuccesfulPayout(){
  try {
    const payout = await prisma.payout.findMany({
      where: {status: PayoutStatus.success },
      include: {
        agent: {
          select: {
            name: true,
            id: true,
          }
        },
                            transaction: {
                      select: {
                        status: true,
                        amount: true,
                        agentPercentage: true,
                        mockupPrice: true,
                        date_paid: true,
                        booking_end_date: true,
                        booking_start_date: true,
                         duration_days: true,
                        apartment: {select:{name: true}}
                      }
                    } 
      }
    })
    return payout 
  } catch (error: any) {
    throw new Error(`${error.message}`)
  }
}
    
async confirmPayout(payoutId: string, remark: string, files: Express.Multer.File[]) {
  try {
    let imageUrl: string | undefined;

    if (files[0]) {
      imageUrl = await uploadImageToSupabase(files[0], "payment-proof");
    }

    const payout = await prisma.payout.update({
      where: { id: payoutId },  
      data: {  
        proof: imageUrl || undefined, // Only set if provided; Prisma will ignore undefined
        status: "success",
        remark,
      },
      include: { agent: {select: {name: true, email: true, id: true} }}, // Include agent to access email and name
    });
    
    // Extract agent details for email
    const agentEmail = payout.agent.email;
    const agentName = payout.agent.name;

    // Send confirmation mail to agent using remark as success details
    await confirmPayoutMail(agentEmail, agentName);

    return payout;
  } catch (error: any) {
    throw new Error(`${error.message}`);
  }
}

async agentTransactions(agentId: string, status?: "pending" | "success" | "upcoming") {
  try {
    const currentDate = new Date(); // Current date: Dec 30, 2025

    // Determine payout filter: for "upcoming", skip payout fetch; otherwise, filter if status provided
    const payoutFilter = status && status !== "upcoming" ? { status } : {};
    let payouts = [];
    if (status !== "upcoming") {
      // Fetch existing payouts + related transaction + booking periods
      payouts = await prisma.payout.findMany({
        where: {
          agentId,
          ...payoutFilter, // Optionally filter by status (pending/success)
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    // Always fetch upcoming transactions (successful, not credited, future bookings)
    // If status === "upcoming", this will be the main "payouts" data
    const upcomingTransactions = await prisma.transaction.findMany({
      where: {
        agent_id: agentId,
        status: 'success',
        credited: false,
        booking_start_date: { gt: currentDate },
      },
      include: {
        bookingPeriods: true,
      },
      orderBy: { created_at: 'desc' }
    });

    const totalActiveListings = await prisma.apartmentLog.count({
      where: {
        agentId,
      },
    });

    // Transform upcoming transactions into "upcoming payout" objects
    const allUpcomingPayouts = upcomingTransactions.map((transaction) => {
      // Calculate agent commission (adjust formula as needed)
      const commissionAmount = transaction.agentPercentage 
        ? (transaction.agentPercentage / 100) * transaction.amount 
        : 0;

      return {
        id: `upcoming-${transaction.id}`,
        agentId: transaction.agent_id,
        amount: commissionAmount,
        status: 'upcoming' as const,
        createdAt: transaction.created_at,
        reference: transaction.reference,
        transactionId: transaction.id,
        bookingStartDate: transaction.booking_start_date,
        bookingEndDate: transaction.booking_end_date,
        durationDays: transaction.duration_days,
      };
    });

    // For "upcoming" filter, use allUpcomingPayouts as the main data list
    const filteredUpcomingPayouts = status === "upcoming" ? allUpcomingPayouts : [];

    // Early return if no data at all
    if (payouts.length === 0 && allUpcomingPayouts.length === 0) {
      return {
        message: "No transactions or upcoming payouts for this agent",
        payouts: [],
        upcomingPayouts: [],
        totals: {
          totalPending: 0,
          totalSuccess: 0,
          totalUpcoming: 0,
          totalPayout: 0, // Alias for totalSuccess
          activeListing: 0
        }
      };
    }

    // Calculate unfiltered totals
    // Total Pending: sum of all pending payout amounts
    const totalPendingAgg = await prisma.payout.aggregate({
      _sum: { amount: true },
      where: { agentId, status: "pending" }
    });
    const totalPending = totalPendingAgg._sum?.amount || 0;

    // Total Success (total earnings/payouts): sum of all successful payout amounts
    const totalSuccessAgg = await prisma.payout.aggregate({
      _sum: { amount: true },
      where: { agentId, status: "success" }
    });
    const totalSuccess = totalSuccessAgg._sum?.amount || 0;

    // Total Upcoming: sum of all calculated commissions from upcoming transactions
    const totalUpcoming = allUpcomingPayouts.reduce((sum, payout) => sum + payout.amount, 0);

    return {
      // Main filtered data: payouts (for pending/success/no filter) or upcomingPayouts (for upcoming filter)
      data: status === "upcoming" ? filteredUpcomingPayouts : payouts,
      // Always include full upcoming for reference (empty array if no upcoming)
      upcomingPayouts: allUpcomingPayouts,
      // Always include full payouts if not filtered to upcoming (for consistency)
      allPayouts: status === "upcoming" ? await prisma.payout.findMany({
        where: { agentId },
        orderBy: { createdAt: 'desc' }
      }) : payouts,
      totals: {
        totalPending,
        totalSuccess,
        totalUpcoming,
        totalPayout: totalSuccess, // Assuming "total payout" means total successful payouts
        activeListing: totalActiveListings
      }
    };

  } catch (error: any) {
    throw new Error(error.message);
  }
}

async agentPayoutById(agentId: string, payoutId: string, status?: "pending" | "success") {
  try {
    const payout = await prisma.payout.findFirst({
      where: {
        id: payoutId,
        agentId,
        ...(status ? { status } : {}) // optional filter
      },
      include: {
        transaction: {
          include: {
            bookingPeriods: true
          }
        }
      }
    });

    if (!payout) throw new Error("Payout not found");

    // Compute totals for this agent
    const [totalEarning, totalPending, totalSuccess] = await Promise.all([
      prisma.payout.aggregate({
        where: { agentId },
        _sum: { amount: true }
      }),
      prisma.payout.aggregate({
        where: { agentId, status: "pending" },
        _sum: { amount: true }
      }),
      prisma.payout.aggregate({
        where: { agentId, status: "success" },
        _sum: { amount: true }
      })
    ]);

    return {
      summary: {
        totalEarning: totalEarning._sum.amount || 0,
        totalPending: totalPending._sum.amount || 0,
        totalSuccess: totalSuccess._sum.amount || 0,
      },
      payout
    };

  } catch (error: any) {
    throw new Error(error.message);
  }
}


async payoutStatistics() { 
  try {
    const [
      totalPayoutResult,
      totalPendingResult,
      totalVerifiedAgents,
      totalRevenueResult
    ] = await Promise.all([
      prisma.payout.aggregate({
        where: { status: 'success' },     
        _sum: { amount: true },
      }),
      prisma.payout.aggregate({
        where: { status: 'pending' },
        _sum: { amount: true },
      }),
      prisma.agent.count({
        where: { status: 'VERIFIED' }, // Assuming AgentStatus enum includes 'VERIFIED'
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true }, // Assumes Transaction model has an 'amount' field
      }),
    ]);

    const totalPayout = totalPayoutResult._sum?.amount || 0;
    const totalRevenue = totalRevenueResult._sum?.amount || 0;

    // Calculate company profit (app revenue)
    const totalAppRevenue = totalRevenue - totalPayout;

    return {
      totalPayout,
      totalPendingPayout: totalPendingResult._sum?.amount || 0,
      totalVerifiedAgents,
      totalRevenue,
      totalAppRevenue, // <-- new field
    };
  } catch (error) {
    console.error('Error fetching payout statistics:', error);
    throw error; // Or handle as needed
  }
}

async rejectPayout(payoutId: string, reason: string){
  try {
    const payout = await prisma.payout.update({
      where: {id: payoutId},
      data:{status: "rejected", reason},
      include: {agent: {select: {name: true, id: true, email: true}}}
    })
    const agentEmail = payout.agent.email;
    const agentName = payout.agent.name;

    // Send confirmation mail to agent using remark as success details
    await rejectPayoutMail(agentEmail, agentName, reason);
    return {message: "Payout successfully rejected!", payout}
  } catch (error: any) {
    throw new Error(`${error.message}`)
  }
}

async createCharges(description: string, amount: number){
  try {
    const charges = await prisma.charges.create({
      data:{
        description,
        amount
      }
    });
    return charges;
  } catch (error) {
    throw new Error (`Could not create charges: ${error.message}`)
  }
}

async updateChargeStatus(chargesId: string, status: "active" | "inactive"){
  try {
    const charges = await prisma.charges.update({
      where:{id: chargesId},
      data:{status}
    });
    return charges;
  } catch (error) {
    throw new Error (`Could not update charges status: ${error.message}`)
  }
}

 async agentPayoutDetails(agentId: string){
  try {
    const payout = await prisma.payout.findMany({where: {agentId}})
    if(!payout) return []
    return payout 
  } catch (error) {
    throw new Error(`${error.message}`)
  }
 }

}

export default new WalletService