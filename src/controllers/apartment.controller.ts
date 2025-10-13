/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import adminService from "../services/admin.service";
import multer from "multer";
import { handleErrorReponse } from "../core/functions";
import { checkAdminAccess } from "../core/functions";
import { successResponse } from "../core/functions";
import {
  UpdateApartmentInput,
  updateApartmentSchema,
} from "../schema/apartment";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
}).array("images", 10);

export const createApartment = async (req: Request, res: Response) => {
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

      const adminId = (req as any).admin.id;
      checkAdminAccess(res, adminId);

      const { name, address, type, servicing, bedroom, price, amenities, agentPercentage } = req.body;

      const parsedPrice = parseInt(price, 10);
      const parsedPercentage = parseInt(agentPercentage, 10)

      if (isNaN(parsedPrice)) {
        res.status(400).json({
          message: "Invalid price value. Must be a valid number",
        });

        return;
      } 

      const apartment = await adminService.createApartment(
        adminId,
        {
          name,
          address,
          type,
          servicing,
          bedroom,
          price: parsedPrice,   
          amenities,
          agentPercentage: parsedPercentage
        },
        req.files as Express.Multer.File[]
      );
 
      res.status(201).json({
        message: "Apartment created successfully",
        data: apartment, 
      });

      return;
    } catch (error) { 
      handleErrorReponse(res, error);

      return;
    }
  }); 
}; 


export const updateApartment = async (req: Request, res: Response) => {
  // Define Multer locally, matching createApartment config
  const upload = multer({
    storage: multer.memoryStorage(),
  }).array("images", 10);

  upload(req, res, async (err) => {
    try {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          message: `File upload error: ${err.message}`,
        });
      } else if (err) {
        return res.status(500).json({
          message: "Unknown file upload error",
        });
      }

      const adminId = (req as any).admin.id;
      checkAdminAccess(res, adminId);

      const apartmentId = req.params.apartmentId;
      if (!apartmentId) {
        return res.status(400).json({
          message: "Apartment ID is required",
        });
      }

      // Schema now transforms price to number and deleteExistingImages to boolean
      const body: UpdateApartmentInput = updateApartmentSchema.parse(req.body);
      const files = req.files as Express.Multer.File[] | undefined; // Now correctly an array

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { deleteExistingImages: _, ...updateData } = body;

      const updatedApartment = await adminService.updateApartment( 
        apartmentId,
        updateData,
        files,
        body.deleteExistingImages // Use the transformed boolean from body
      );

      successResponse(
        res,
        200,
        "Apartment Updated Successfully",
        updatedApartment
      );
    } catch (error) {
      handleErrorReponse(res, error);
    }
  });
};

export const searchApartment = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).admin.id;

    checkAdminAccess(res, adminId);

    const { searchTerm } = req.query;
    if (!searchTerm) throw new Error("Search term is required");

    const apartments = await adminService.searchApartments(
      searchTerm as string
    );

    const totalCount = await adminService.listApartments(adminId, 1, 10);

    const response = {
      apartments,
      pagination: {
        totalItems: totalCount.pagination.totalItems,
        totalPages: totalCount.pagination.totalPages,
        currentPage: 1,
        itemsPerPage: 10,
      },
    };

    successResponse(res, 200, "Apartment Search result", response);
  } catch (error) {
    handleErrorReponse(res, error);
  }
};

export const deleteApartment = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).admin.id;

    checkAdminAccess(res, adminId);

    const {apartmentId} = req.params;

    if (!apartmentId) {
      res.status(400).json({ message: "AppartmentId is required!" });

      return;
    }

    await adminService.deleteApartment(apartmentId);

    res.status(200).json({ message: "seleted apartment deleted" });

    return;
  } catch (error) {
    handleErrorReponse(res, error);
  }
};
