// import {
//   v2 as cloudinary,
//   UploadApiResponse,
//   UploadApiOptions,
//   UploadApiErrorResponse,
//   UploadResponseCallback,
// } from "cloudinary";

// import { resourceTypes } from "../types";
// import FileConfig from "../config/fileConfig";

// class CloudinaryStorageProvider {
//   constructor() {
//     cloudinary.config({
//       cloud_name: FileConfig.disks.cloudinary.cloud_name,
//       api_key: FileConfig.disks.cloudinary.api_key,
//       api_secret: FileConfig.disks.cloudinary.api_secret,
//       secure: FileConfig.disks.cloudinary.secure,
//     });
//   }

//   async removeFile(
//     publicId: string,
//     resourceType: string
//   ): Promise<UploadApiResponse | UploadApiErrorResponse> {
//     return cloudinary.uploader.destroy(publicId, {
//       resource_type: resourceType,
//     });
//   }

//   async uploadFile(
//     file: Express.Multer.File,
//     resource_type?: resourceTypes,
//     folder?: string
//   ): Promise<UploadApiResponse> {
//     return new Promise((resolve, reject) => {
//       cloudinary.uploader
//         .upload_stream(
//           {
//             resource_type,
//             folder,
//           },
//           (err, result) => {
//             if (err) return reject(err);
//             resolve(result as UploadApiResponse);
//           }
//         )
//         .end(file.buffer);
//     });
//   }
// }

// export default CloudinaryStorageProvider;

import {v2 as cloudinary }from "cloudinary";

cloudinary.config({
  cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
  api_key:process.env.CLOUDINARY_API_KEY,
  api_secret:process.env.CLOUDINARY_API_SECRET
});

export default cloudinary;