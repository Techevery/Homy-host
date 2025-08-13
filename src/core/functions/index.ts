import { Response } from "express";
import { logger } from "../helpers/logger";
import { supabase } from "../utils/supabase";

export function handleErrorReponse(res: Response, error: unknown) {
  if (error instanceof Error) {
    logger.error({
      message: error.message,
      params: {
        name: error.name,
        stack: error.stack,
      },
    });

    const statusMap: Record<string, number> = {
      "Missing required fields": 400,
      "Admin already exists": 409,
      "Admin not found": 404,
      "Invalid credentials": 401,
      "Forbidden Access": 403,
      "Unauthorized access": 401,
      "Agent not found": 404,
      "Invalid status": 400,
      "Search term is required": 400,
    };

    const status = statusMap[error.message] || 500;
    res.status(status).json({ message: error.message });

    return;
  }

  logger.error({
    message: "Internal Server Error",
    params: { error },
  });

  res.status(500).json({ message: "INTERNAL SERVER ERROR" });

  return;
}

export function checkAdminAccess(res: Response, adminId: string) {
  if (!adminId) {
    res.status(403).json({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Forbidden: No Admin account access",
        details: "No valid admin ID provided",
      },
    });

    return false;
  }

  return true;
}

export function successResponse(
  res: Response,
  statusCode: number = 200,
  message: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any
) {
  res.status(statusCode).json({
    message,
    data,
  });

  return;
}

export async function deleteImageFromBucket(imageUrl: string): Promise<void> {
  try {
    // Extract the file path from the full URL
    const url = new URL(imageUrl);
    const filePath = url.pathname.split("/storage/v1/object/public/")[1];

    if (!filePath) throw new Error("Invalid Supabase image URL");

    const { error } = await supabase.storage
      .from("apartments")
      .remove([filePath]);

    if (error) throw error;

    logger.info(`Successfully deleted image: ${filePath}`);
  } catch (error) {
    logger.error("Error deleting image from supabase:", error);
    throw new Error("Failed to delete image from storage");
  }
}

export function checkAgentAccess(res: Response, agentId: string) {
  if (!agentId) {
    res.status(403).json({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Forbidden: No Agent account access",
        details: "No valid agent ID provided",
      },
    });

    return false;
  }

  return true;
}

// function reverseString(s:string){
//   const response = [...s].reverse().join("")
//   console.log(response)
// }

// reverseString("racecar")

// function palidrome(s:string){
//   const original = s.toLowerCase();
//   console.log(original);

//   return original === [...s].reverse().join("")

// }

// palidrome("racecar")