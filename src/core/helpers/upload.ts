/* eslint-disable @typescript-eslint/no-explicit-any */
import cloudinary from "../utils/cloudinary";

export const uploadToCloudinary = async (filePath: any) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(filePath, (err: any, result: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};
