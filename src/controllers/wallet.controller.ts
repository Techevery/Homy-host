import { Request, Response } from "express";
import WalletService from "../services/wallet.service";
import { handleErrorReponse } from "../core/functions";
import multer from "multer";

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