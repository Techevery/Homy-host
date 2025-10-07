/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import adminService from "../services/admin.service";
import { handleErrorReponse } from "../core/functions";
import { checkAdminAccess } from "../core/functions";
import dashboardService from "../services/dashboard.service";

export const verifyAgent = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).admin.id;

    checkAdminAccess(res, adminId);

    const { agentId, status } = req.body;
    if (!agentId || !status)
      throw new Error("Agent ID and Status are required");

    if (!["VERIFIED", "UNVERIFIED"].includes(status)) {
      throw new Error("Invalid status. Must be 'VERIFIED' or 'UNVERIFIED'");
    }

    const updatedAgent = await adminService.verifyAgent(
      adminId,
      agentId,
      status as "VERIFIED" | "UNVERIFIED" 
    );

    res.status(200).json({       
      message: "Agent Status Updated",        
      data: {            
        agentName: updatedAgent.name,   
        agentId: updatedAgent.id,               
        status: updatedAgent.status,  
      },
    });

    return;
  } catch (error) {
    handleErrorReponse(res, error);

    return;
  }
};

export const listProperties = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).admin.id;

    checkAdminAccess(res, adminId);

    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const response = await adminService.listApartments(adminId, page, pageSize);
             
    res.status(200).json({
      message: "Properties retrieved",
      data: response,
    });      

    return;
  } catch (error) {
    handleErrorReponse(res, error);

    return;
  }
};

export const listAgents = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).admin.id;

    checkAdminAccess(res, adminId);

    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const response = await adminService.listAgents(page, pageSize);

    res.status(200).json({
      message: "Agents retrieved",
      data: response,
    });

    return;
  } catch (error) {
    handleErrorReponse(res, error);

    return;
  }
};

export const adminProfile = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).admin.id;

    checkAdminAccess(res, adminId);

    const profile = await adminService.getAdminProfile(adminId);

    res.status(200).json({
      message: "Admin Profile fetched succcessfully",
      data: profile,
    });

    return;
  } catch (error) {
    handleErrorReponse(res, error);

    return;
  }
};

export const editAdminProfile = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).admin.id;

    checkAdminAccess(res, adminId);

    const { name, address, password, confirmPassword } = req.body;

    const updatedProfile = await adminService.updateAdminProfile(adminId, {
      name,
      address,
      password,
      confirmPassword,
    });

    res.status(200).json({
      message: "Admin Profile Updated successfully",
      data: updatedProfile,
    });

    return;
  } catch (error) {
    handleErrorReponse(res, error);

    return;
  }
};

export const getAgentProfile = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).admin.id;
    const agentId = req.body.agentId;

    checkAdminAccess(res, adminId);

    const agentProfile = await adminService.getAgentProfileById(agentId);

    res.status(200).json({
      message: "Agent Profile successfully feteched",
      data: agentProfile,
    });

    return;
  } catch (error) {
    handleErrorReponse(res, error);

    return;
  }
};

//TODO: stats controller for total income, no of verified agent, total agent, no of booking

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const stats = await dashboardService.getDashboardStats();

    res.status(200).json({
      message: "Dashboard stats feteched successfully",
      data: stats,
    });

    return;
  } catch (error) {
    handleErrorReponse(res, error);
  }
};

// TODO: add legal name, preferred name, phone number, email, address, gender, profile picture, to admin login response object,

// TODO: create a paymemnt report, format is year, month and total earnings for the month, including summaries for each month, summaries include customer emails, agent basic info, aprtment info and transaction details
export const getTransactionDetailsByYear = async (
  req: Request,
  res: Response
) => {
  try {
    const year = parseInt(req.body.year as string);

    if (!year) {
      res.status(400).json({
        message: "Year is required",
      });

      return;
    }

    const transactionDetails = await dashboardService.getTransaction(year);

    if (!transactionDetails) {
      res.status(404).json({
        message: "No transaction details found for this year",
      });

      return;
    }

    res.status(200).json({
      message: "Transaction details fetched succcessfully",
      data: transactionDetails,
    });

    return;
  } catch (error) {
    handleErrorReponse(res, error);
  }
};

// TODO: implement transfer endpoint for payout into agent accounts

// export const transferPayout = async (req:Request, res:Response) => {
//   try {
    
//   } catch (error) {
//     handleErrorReponse(res, error);
//   }
// }