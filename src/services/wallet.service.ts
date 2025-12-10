import { PayoutStatus } from "@prisma/client";
import prisma from "../core/utils/prisma"
import { uploadImageToSupabase } from "../core/utils/supabase";
import { confirmPayoutMail, rejectPayoutMail } from "../email/notification";

class WalletService {
    async getAllPayout(){
        try {
            const payout = await prisma.payout.findMany({
              where:{status: "pending"},
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
                        apartment: {select:{name: true}}
                      }
                    }   
                },
            });
            return payout 
        } catch (error: any) {
            throw new Error(`${error.message}`)
        }
    }
  
async getSuccesfulPayout(){
  try {
    const payout = await prisma.payout.findMany({
      where: {status: PayoutStatus.success},
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
      include: { agent: true }, // Include agent to access email and name
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


async agentTransactions(agentId: string, status?: "pending" | "success") {
  try {
    // Optional filter
    const payoutFilter = status ? { status } : {};

    // Fetch transactions + payout + booking periods
    const payouts = await prisma.payout.findMany({
      where: {
        agentId,
        ...payoutFilter, // optionally filter by status
      },
      include: {
        transaction: {
          include: {
            bookingPeriods: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!payouts || payouts.length === 0) {
      return {
        message: "No transaction for this agent",
        payouts: [],
        totalEarnings: 0,
        totalPending: 0,
        totalSuccess: 0
      };
    }

    // Calculate totals
    const totalEarnings = await prisma.payout.aggregate({
      _sum: { amount: true },
      where: { agentId, status: "success" }
    });

    const totalPending = await prisma.payout.aggregate({
      _sum: { amount: true },
      where: { agentId, status: "pending" }
    });

    const totalSuccess = await prisma.payout.aggregate({
      _sum: { amount: true },
      where: { agentId, status: "success" }
    });

    return {
      payouts,
      totals: {
        totalEarnings: totalEarnings._sum.amount || 0,
        totalPending: totalPending._sum.amount || 0,
        totalSuccess: totalSuccess._sum.amount || 0,
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
      data:{status: "cancelled", reason},
      include: {agent: true}
    })
    const agentEmail = payout.agent.email;
    const agentName = payout.agent.name;

    // Send confirmation mail to agent using remark as success details
    await rejectPayoutMail(agentEmail, agentName, reason);
    return `Payout successfully rejected!`
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

async updateStatus(chargesId: string, status: "active" | "inactive"){
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
// reject payout
// agent payout     //  

}

export default new WalletService