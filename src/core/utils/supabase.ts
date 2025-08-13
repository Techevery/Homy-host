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
    const filePath = `agents/${Date.now()}_${file.originalname}`;

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
