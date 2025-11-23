import { PayoutStatus } from "@prisma/client";
import prisma from "../core/utils/prisma"
import { uploadImageToSupabase } from "../core/utils/supabase";
import { confirmPayoutMail, rejectPayoutMail } from "../email/notification";

class WalletService {
    async getAllPayout(){
        try {
            const payout = await prisma.payout.findMany({
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
        status: PayoutStatus.success,
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

async agentTransactions(agentId: string){
  try {
    const transactions = await prisma.payout.findMany({
      where:{agentId}
    })
    if(!transactions) throw new Error(`No transaction for this user`)
      return transactions 
  } catch (error: any) {
    throw new Error(`${error.message}`)
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
        _sum: { amount: true }, // Assumes Transaction model has an 'amount' field of type Float; filter further if needed (e.g., for positive/income transactions only)
      }),
    ]);

    return {
      totalPayout: totalPayoutResult._sum?.amount || 0,
      totalPendingPayout: totalPendingResult._sum?.amount || 0,
      totalVerifiedAgents,
      totalRevenue: totalRevenueResult._sum?.amount || 0,
    };
  } catch (error) {
    console.error('Error fetching payout statistics:', error);
    throw error; // Or handle as needed, e.g., return a default error response
  }
}

async rejectPayout(payoutId: string, reason: string){
  try {
    const payout = await prisma.payout.update({
      where: {id: payoutId},
      data:{status: PayoutStatus.cancelled, reason},
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

// reject payout     

}

export default new WalletService