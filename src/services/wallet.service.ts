import { PayoutStatus } from "@prisma/client";
import prisma from "../core/utils/prisma"
import { uploadImageToSupabase } from "../core/utils/supabase";

class WalletService {
    async getAllPayout(){
        try {
            const payout = await prisma.payout.findMany()
            return payout 
        } catch (error: any) {
            throw new Error(`${error.message}`)
        }
    }

    async confirmPayout(payoutId: string, remark: string, files: Express.Multer.File[]){
        try {
                            let imageUrl: string | any;
            
                            if (files [0]) {
                              imageUrl = await uploadImageToSupabase(
                                files[0],
                                "payment-proof"
                              ); 
                            }    
                        const payout = await prisma.payout.update({
                            where: {id: payoutId},
                            data: {
                                proof: imageUrl,
                                status: PayoutStatus.success,
                                remark
                            }
                        })
        } catch (error:any) {
            throw new Error(`${error.message}`)
        }
    }

}

export default new WalletService