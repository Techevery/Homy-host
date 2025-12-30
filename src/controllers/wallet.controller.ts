import { Request, Response } from "express";
import WalletService from "../services/wallet.service";
import { handleErrorReponse } from "../core/functions";
import multer from "multer";
import walletService from "../services/wallet.service";
import { error } from "console";

const upload = multer({
  storage: multer.memoryStorage(),
}).array("image", 1);


export const getPayoutRequest = async (req: Request, res: Response) => {
    try {
        const result = await WalletService.getPayoutRequest()
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
  
    export const getSucessfulPayout = async (req: Request, res: Response) => {
      try {
        const result = await walletService.getSuccesfulPayout()
        res.status(200).json(result)
      } catch (error: any) {
        res.status(500).json(`${error.message}`)
      }
    }

    export const agentTransactions = async (req: Request, res: Response) => {
  try {
    const agentId = (req as any).agent.id;

    // Read optional query param: ?status=pending or ?status=success
    const { status } = req.query as { status?: "pending" | "success" | "upcoming" };

    // Call service with or without status
    const result = await walletService.agentTransactions(agentId, status);

    return res.status(200).json({
      success: true,
      message: "Agent transactions fetched successfully",
      data: result
    });

  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "An error occurred"
    });
  }
};

export const agentPayoutById = async (req: Request, res: Response) => {
  try {
    const agentId = (req as any).agent.id;
    const { payoutId } = req.params;

    // Optional filter: ?status=pending | success
    const { status } = req.query as { status?: "pending" | "success" };

    const result = await walletService.agentPayoutById(agentId, payoutId, status);

    return res.status(200).json({
      success: true,
      message: "Payout data retrieved",
      data: result
    });

  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

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
        const {reason, payoutId} = req.body
        const result = await walletService.rejectPayout(payoutId, reason)
        res.status(200).json(result)
      } catch (error: any) {
        res.status(400).json(`${error.message}`)
      }
    }
  
    export const createCharges = async (req: Request, res: Response) => {
      try {
        const { description, amount } = req.body;
        const result = await walletService.createCharges(description, amount)
        res.status(201).json(result)
      } catch (error: any) {
        res.status(400).json(`${error.message}`)
      }
    }

    export const approveCharges = async (req: Request, res: Response) => {
      try {
        const {status} = req.body
        const {chargeId} = req.params 
        const result = await walletService.updateChargeStatus(chargeId, status)
        res.status(200).json(result)
      } catch (error) {
        res.status(500).json(`${error.message}`)
      }
    }

export const agentPayout = async (req: Request, res: Response) => {
  try {
    const agentId = (req as any).agent.id
    const result = await walletService.agentPayoutDetails(agentId)
    res.status(200).json(result)
  } catch (error) {
   throw new Error(`${error.message}`) 
  }
}