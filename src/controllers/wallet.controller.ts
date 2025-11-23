import { Request, Response } from "express";
import WalletService from "../services/wallet.service";
import { handleErrorReponse } from "../core/functions";
import multer from "multer";
import walletService from "../services/wallet.service";
import { error } from "console";

const upload = multer({
  storage: multer.memoryStorage(),
}).array("image", 1);


export const getAllPayout = async (req: Request, res: Response) => {
    try {
        const result = await WalletService.getAllPayout()
        res.status(200).json(result)
    } catch (error: any) { 
        throw new Error(`${error.message}`)
    }
}

export const confirmPayout = async (req: Request, res: Response) => {
  upload(req, res, async (err) => {
    try {
      if (err instanceof multer.MulterError) {
        res.status(400).json({
          message: `File upload error: ${err.message}`,
            });
    
            return;
          } else if (err) {
            res.status(500).json({
              message: "Unknown file upload error",
            });
    
            return;
          }
    
          const { payoutId, remark } = req.body;
          console.log("file", req.files, "body", req.body)
    
    
          const apartment = await WalletService.confirmPayout(
            payoutId,
            remark,
            req.files as Express.Multer.File[]
          );  
     
          res.status(201).json({
            message: "Banner created successfully",
            data: apartment, 
          });
    
          return;
        } catch (error) { 
          handleErrorReponse(res, error);
    
          return;
        }
      });
    }
  
    export const agentTransactions = async (req: Request, res: Response) => {
      try {
         const agentId = (req as any).agent.id; 
         const result = await walletService.agentTransactions(agentId)
         res.status(200).json(result)
      } catch (error: any) {
        res.status(400).json(`${error.messsage}`)
      }
    }

    export const getPayoutStatistics = async (req: Request, res: Response) => {
      try {
        const payout = await walletService.payoutStatistics()
        res.status(200).json(payout)
      } catch (error) {
        res.status(400).json(`${error.message}`)
      }
    }

    export const rejectPayout = async (req: Request, res: Response) => {
      try {
        const {reasson, payoutId} = req.body
        const result = await walletService.rejectPayout(payoutId, reasson)
        res.status(200).json(result)
      } catch (error: any) {
        res.status(400).json(`${error.message}`)
      }
    }