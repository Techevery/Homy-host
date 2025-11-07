/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import agentService from "../services/agent.service";
import { checkAgentAccess } from "../core/functions";

export const enlistApartment = async (req: Request, res: Response) => {
  try {
    const agentId = (req as any).agent.id;

    checkAgentAccess(res, agentId);

    const { apartmentId, markedUpPrice, agentPercentage } = req.body;

    // rreturn the total amount if there is mocup price else return the orifginal amount 
    await agentService.addPropertyToListing(
      agentId,
      apartmentId,
      markedUpPrice,
      agentPercentage
    );  

    res
      .status(200)
      .json({ message: "Apartment added to listing successfully" });
   
    return;
  } catch (error) {
    handleErrorResponse(res, error);     

    return;
  }
};

export const agentprofileDetails = async(req: Request, res: Response)=> {
  try {
      const {agent} = (req as any)
      const result = await agentService.agetProfile(agent)
      res.status(200).json({message: "Agent profile details", result})
  } catch (error: any) {
    res.status(500).json(`${error.message}`)
  }

}

export const publicProperties = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await agentService.getAllPublicProperties(page, limit);
 
    res.status(200).json({
      message: "Properties retrived successfully",
      data: result,
    });

    return;
  } catch (error) {
    handleErrorResponse(res, error);

    return;
  }
}

export const removeApartment = async (req: Request, res: Response) => {
  try {
    const agentId = (req as any).agent.id;

    checkAgentAccess(res, agentId);

    const { apartmentId } = req.body;

    await agentService.removePropertyFromListing(agentId, apartmentId);

    res
      .status(200)
      .json({ message: "Apartment removed from listing successfully" });

    return;
  } catch (error) {
    handleErrorResponse(res, error);

    return;
  }
};

export const enlistedProperties = async (req: Request, res: Response) => {
  try {
    const agentId = (req as any).agent.id;

    checkAgentAccess(res, agentId);

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await agentService.getAgentProperties(agentId, page, limit);

    res.status(200).json({
      message: "Properties retrived successfully",
      data: result,
    });

    return;
  } catch (error) {
    handleErrorResponse(res, error);

    return;
  }
};

export const getPropertiesBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await agentService.getAgentPropertiesBySlug(
      slug,
      page,
      limit 
    );
    
    res.status(200).json({
      message: "Properties retrieved successfully",
      data: result,
    });

    return;
  } catch (error) {
    handleErrorResponse(res, error);

    return;
  }
};

export const updateProfile = async (req:Request, res:Response) => {
  try {
      const agentId = (req as any).agent.id;
    checkAgentAccess(res, agentId);
    const {personalUrl} = req.body
    // const result = await this.agentService.updateAgentProfile(agentId, )
    // res.ststus(200).json(result)
  } catch (error: any) {
    res.status(400).json(`${error.message}`)
  }
}

export const createAgentBanner = async (req: Request, res: Response) => {
  try {
    const agentId = (req as any).agent.id;
    checkAgentAccess(res, agentId);

    const { name, description, imageUrls } = req.body;

    // const result = await bannerService.createBanner(name, description, agentId, imageUrls);
    // res.status(201).json({ message: "Banner created successfully", data: result });
  } catch (error: any) {
    handleErrorResponse(res, error);
  }
};

function handleErrorResponse(res: Response, error: unknown) {
  console.error(error);

  if (error instanceof Error) {
    const statusMap: Record<string, number> = {
      "Account already exists": 409,
      "Account not found": 404,
      "Invalid credentials": 401,
      "Only verified agents can add properties": 403,
      "Apartment not found": 404,
      "Apartment already listed": 409,
      "Agent not found": 404,
      "Listing not found": 404,
    };

    const status = statusMap[error.message] || 500;
    res.status(status).json({ message: error.name });

    return;
  }
}
