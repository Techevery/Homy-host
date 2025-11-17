import { Request, Response } from "express";
import WalletService from "../services/wallet.service";

export const payout = async (req:Request, res: Response) =>{
    try {
        const agentId = (req as any).agent.id
        const {accountNumber, accountName, bankName, amount} = req.body
        const result = await WalletService.placeWithdrawer(agentId, accountNumber, accountName, bankName, amount)
        res.status(200).json({message: "Withdrawer placed successfully!", result})
    } catch (error: any) {
        res.status(500).json(`${error.message}`)
    }
}

export const getAllPayout = async (req: Request, res: Response) => {
    try {
        const result = await WalletService.getAllPayout()
        res.status(200).json(result)
    } catch (error: any) { 
        throw new Error(`${error.message}`)
    }
}