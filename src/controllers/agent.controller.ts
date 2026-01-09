import { Request, Response } from "express";
import agentService from "../services/agent.service";
import { checkAgentAccess, handleErrorReponse } from "../core/functions";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
}).array("image", 2);

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

    const { apartmentId } = req.params;

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

export const createAgentBanner = async (req: Request, res: Response) => {
  try {
    const agentId = (req as any).agent.id;
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
        
              const { name, description } = req.body;
        
        
              const apartment = await agentService.createBanner(
                name,
                description,
                agentId,
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
  } catch (error: any) {
    handleErrorResponse(res, error);
  }
};

export const getBanners = async (req: Request, res: Response) => {
  try {
    const agentId = (req as any).agent.id;
    const result = await agentService.fetchBanner(agentId)
    res.status(200).json({
      message: "Banner retrived successfully!",
      result
    })
  } catch (error: any) {
    throw new Error(`${error.message}`)
  }
}

export const updateAgentBanner = async (req: Request, res: Response) => {
  try {
    const agentId = (req as any).agent.id;
    const { id } = req.params; // Assuming banner ID comes from params

    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: `File upload error: ${err.message}` });
      } else if (err) {
        return res.status(500).json({ message: "Unknown file upload error" });
      }

      const { name, description } = req.body;
      const files = req.files as Express.Multer.File[];

      const updatedBanner = await agentService.updateBanner({
        bannerId: id,
        agentId,
        name: name?.trim(),
        description: description?.trim(),
        files,
      });

      return res.status(200).json({
        message: "Banner updated successfully",
        data: updatedBanner,
      });
    });
  } catch (error: any) {
    handleErrorResponse(res, error);
  }
};

export const deleteBanner = async (req: Request, res: Response) => {
  try {
        const agentId = (req as any).agent.id;
        const {id} = req.params
        const result = await agentService.deleteBanner(id, agentId)
        res.status(200).json({message: "Banner deleted successfully!"})
  } catch (error: any) {
    throw new Error(`${error.message}`)
  }
}

// feetch appartment that has not been enlisted 
export const getUnlistedApartmentsCtrl = async (
  req: Request,
  res: Response
) => {
  try {
    const agentId = (req as any).agent.id;

    const limit = Math.min(parseInt(req.query.limit as string, 10) || 10, 100);
    const cursor = (req.query.cursor as string) || undefined;

    const result = await agentService.getUnlistedApartments(agentId, {
      limit,
      cursor,
    });

    // DO NOT `return` here
    res.status(200).json({
      success: true,
      ...result,
      message: 'Apartments not yet listed by this agent',
    });
  } catch (error: any) {
    console.error('getUnlistedApartmentsCtrl error:', error);

    // DO NOT `return` here either
    res.status(500).json({
      success: false,
      message: 'Failed to fetch apartments',
      error: error.message,
    });
  }
};


export const forgetPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const result = await agentService.initiatePasswordReset(email);
    res.status(200).json({
      message: "Password reset initiated",
      data: result,
    });
  } catch (error: any) {
    res.status(500).json(`${error.message}`);
  }
}

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    const result = await agentService.resetPassword(token, newPassword);
    res.status(200).json({ 
      data: result,  
    });
  } catch (error: any) {
    res.status(500).json(`${error.message}`);
  }
}


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
