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
    limits: {
    fileSize: 20 * 1024 * 1024, // 20MB per file
    files: 10,  
    }                // max number of files
}).array("images", 10);

export const createApartment = async (req: Request, res: Response) => {
  upload(req, res, async (err) => {
    try {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({
            message: "File size too large. Maximum allowed file size is 20MB per image.",
            error: "FILE_SIZE_EXCEEDED"
          });
          return;
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          res.status(400).json({
            message: "Too many files. Maximum allowed is 10 images.",
            error: "FILE_COUNT_EXCEEDED"
          });
          return;
        }
        res.status(400).json({
          message: `File upload error: ${err.message}`,
          error: "FILE_UPLOAD_ERROR"
        });

        return;
      } else if (err) {
        res.status(500).json({
          message: "Unknown file upload error. Please try again with smaller files.",
          error: "UNKNOWN_UPLOAD_ERROR"
        });

        return;
      }

      const adminId = (req as any).admin.id;
      checkAdminAccess(res, adminId);

      const { name, address, type, servicing, bedroom, price, amenities, agentPercentage, location } = req.body;

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
          agentPercentage: parsedPercentage,
          location
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
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 20 * 1024 * 1024, // 20MB per file
      files: 10,
    }
  }).array("images", 10);

  upload(req, res, async (err) => {
    try {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            message: "File size too large. Maximum allowed file size is 20MB per image.",
            error: "FILE_SIZE_EXCEEDED"
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            message: "Too many files. Maximum allowed is 10 images.",
            error: "FILE_COUNT_EXCEEDED"
          });
        }
        return res.status(400).json({
          message: `File upload error: ${err.message}`,
          error: "FILE_UPLOAD_ERROR"
        });
      }

      const adminId = (req as any).admin.id;
      checkAdminAccess(res, adminId);

      const apartmentId = req.params.apartmentId;

      const updateData: UpdateApartmentInput = updateApartmentSchema.parse(req.body);

      const files = req.files as Express.Multer.File[] | undefined;

      const result = await adminService.updateApartment(
        apartmentId,
        updateData,
        files
      );

      return successResponse(res, 200, "Apartment updated successfully", result);
    } catch (error) {
      return handleErrorReponse(res, error);
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
