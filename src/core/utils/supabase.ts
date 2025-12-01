import { createClient } from "@supabase/supabase-js";

import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_PROJECT_URL as string;
const supabaseKey = process.env.SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseKey);

export const uploadImageToSupabase = async (
  file: Express.Multer.File,
  bucketName: string
): Promise<string> => {
  try {
    const filePath = `${bucketName}/${Date.now()}_${file.originalname}`;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
      });
  
    if (error) {
      console.error(`Supabase upload Error (${bucketName}):`, error);

      throw new Error(`Error uploading image to ${bucketName}`);
    }

    console.log("Supabase URL:", supabaseUrl)

    return `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`;
  } catch (error) {
    console.error(`Unexpected Supabase Upload Error (${bucketName}):`, error);

    throw new Error(`Failed to upload image to ${bucketName}`);
  }
};


export const deleteImageFromSupabase = async (imageUrl: string) => {
  try {
    if (!imageUrl) return;

    // Example Supabase URL format:
    // https://xyzcompany.supabase.co/storage/v1/object/public/homey-images/abc123.jpg

    // Extract bucket + file path
    const url = new URL(imageUrl);

    // Path starts after `/object/`
    const fullPath = url.pathname.split("/object/")[1]; 
    // Example: "public/homey-images/abc123.jpg"

    const parts = fullPath.split("/");
    const bucket = parts[1]; // "homey-images"
    const filePath = parts.slice(2).join("/"); // "abc123.jpg"

    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) {
      console.error("❌ Error deleting image from Supabase:", error);
      return false;
    }

    console.log("🗑️ Deleted Supabase image:", filePath);
    return true;
  } catch (err) {
    console.error("❌ Error in deleteImageFromSupabase:", err);
    return false;
  }
};

