import {Request, Response} from "express";
import adminService from "../services/admin.service";
import upload from "../middlewares/multer";
import agentService from "../services/agent.service";
import { handleErrorReponse } from "../core/functions";
import multer from "multer";

export const createAdminProfile = async (req: Request, res: Response) => {
  try {
    const { name, email, password, address, gender } = req.body;

    const admin = await adminService.createAdmin({
      name,
      email,
      password,
      address,
      gender,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...adminWithoutPassword } = admin;

    res.status(201).json({
      message: "Admin Profile created",
      data: adminWithoutPassword,
    });

    return;
  } catch (error) {
    handleErrorReponse(res, error);

    return;
  }
};

export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const authResponse = await adminService.authenticateAdmin(email, password);

    res.status(200).json({
      message: "Admin Authenticated",
      data: authResponse,
    });

    return;
  } catch (error) {
    handleErrorReponse(res, error);

    return;
  }
}; 

export const createAgent = async (req: Request, res: Response) => {
  upload(req, res, async (err) => {
    try {
      if (err instanceof multer.MulterError) {
        return res
          .status(400)
          .json({ message: `File upload error: ${err.message}` });
      } else if (err) {
        return res.status(500).json({ message: "Unknown file upload error" });
      }
  
      const agent = await agentService.registerAgent(
        req.body,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        req.files as any
      );

      return res.status(201).json({
        message: "Agent created successfully",
        data: agent,
      });
    } catch (error) {
      handleErrorReponse(res, error);
    }  
  });
};


export const agentLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const authResponse = await agentService.authenticateAgent(email, password);

    res.status(200).json({
      message: "Login succesful",
      data: authResponse,
    });

    return;
  } catch (error) {
    handleErrorReponse(res, error);
  }
};
  
export const updateAgent = async (req: Request, res: Response) => {
  upload(req, res, async (err) => {
    try {
      if (err instanceof multer.MulterError) {
        return res
          .status(400)
          .json({ message: `File upload error: ${err.message}` });
      } else if (err) {
        return res.status(500).json({ message: "Unknown file upload error" });
      }

    const agentId = (req as any).agent.id;
      
      const agent = await agentService.updateAgentProfile(
        agentId,
        req.body,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        req.files as any   
      );      

      return res.status(200).json({
        message: "Agent updated successfully",
        data: agent,
      });
    } catch (error) {
      handleErrorReponse(res, error);
    }  
  });
};