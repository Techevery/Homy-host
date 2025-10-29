import { Request, Response } from "express";
import { handleErrorReponse } from "../core/functions";
import multer from "multer";
import bannerService from "../services/banner.service";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
}).array("image", 2);

export const createBanner = async (req: Request, res: Response) => {
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
    
          const { name, desscription } = req.body;
          console.log("file", req.files, "body", req.body)
    
    
          const apartment = await bannerService.createBanner(
            name,
            desscription,
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

    export const fetchBanner = async (req: Request, res:Response) => {
        try {
            const result = await bannerService.fetchBanner()
            res.status(201).json({
                message: "banner data",
                data: result 
            })
        } catch (error) {
            handleErrorReponse(res, error);
            return 
        }
    }

    export const getBannerById = async (req: Request, res: Response) => {
        try {
            const {id} = req.params 
            const result = await bannerService.bannerById(id)
            res.status(201).json({
                result
            })
        } catch (error: any) {
            throw new Error(`${error.message}`)
        }
    }

    export const deleteBanner = async (req: Request, res: Response) => {
      
    }