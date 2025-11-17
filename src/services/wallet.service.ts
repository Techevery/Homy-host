import prisma from "../core/utils/prisma"

class WalletService {
    async getAllPayout(){
        try {
            const payout = await prisma.payout.findMany()
            return payout 
        } catch (error: any) {
            throw new Error(`${error.message}`)
        }
    }

    async placeWithdrawer(agentId: string, accountNumber: string, accountName: string, bankName: string, amount: number) {
        try {
            const wallet = await prisma.wallet.findFirst({where: {agentId}})
            if(!wallet) throw new Error("Access denied you don't have a wallet!")
            // validate the amount to be withdrawn if the user hhas such amount 
        if(wallet.balance && wallet.balance < amount){
            throw new Error("Insuficient balance")
        }
        // create a payout for this user 
        const payout = await prisma.payout.create({
            data:{
                agentId,
                accountName,
                accountNumber,
                bankName,
                amount 
            }
        })
        } catch (error: any) {
            throw new Error(`${error.message}`)
        }
    }
}

export default new WalletService