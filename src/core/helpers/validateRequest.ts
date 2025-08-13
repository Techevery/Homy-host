import { Request, Response, NextFunction } from "express";  

const validateRequest = (requiredFields:string[], location: "body" | "query" | "params") => {
  return (req:Request, res:Response, next:NextFunction) => {
    const data = req[location];
    const missingFields = requiredFields.filter(field => !(field in data));

    if(missingFields.length > 0) {
      return res.status(400).json({
        status:"error",
        message:"Missing required fields",
        missingFields
      });
    }

    next();
  }
}

export default validateRequest;
