import { PayoutStatus } from "@prisma/client";
import prisma from "../core/utils/prisma"
import { uploadImageToSupabase } from "../core/utils/supabase";
import { confirmPayoutMail } from "../email/notification";

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

}

export default new WalletService