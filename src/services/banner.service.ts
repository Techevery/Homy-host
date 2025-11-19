import prisma from "../core/utils/prisma";
import { uploadImageToSupabase } from "../core/utils/supabase";

class BannerService{
    async createBanner(name: string, description: string, files: Express.Multer.File[]){
          try {
                let imageUrl: string | any;

                if (files [0]) {
                  imageUrl = await uploadImageToSupabase(
                    files[0],
                    "banner"
                  ); 
                }   

            const banner = await prisma.banner.create({
                data: {
                    name,
                    description,
                    image_url: imageUrl
                }
            })
            return banner
          } catch (error: any) { 
            throw new Error(`${error.message}`)
          } 
    }

    async fetchBanner(){
        try {
            const banners = await prisma.banner.findMany()
            return banners
        } catch (error: any) {
            throw new Error(`${error.message}`)
        }
    }

    async bannerById(id: string){
        try {
            const banner = await prisma.banner.findUnique({where: {id}})
            if(!banner) throw new Error(`cannot find id for this bannner`)
                return banner
        } catch (error: any) {
            throw new Error(`${error.message}`)
        }
    }

async updateBanner(
  id: string,
  name: string | undefined,
  description: string | undefined,
  files: Express.Multer.File[]
) {
  try {
    const banner = await prisma.banner.findUnique({ where: { id } });
    if (!banner) throw new Error("Banner not found");

    let imageUrl: string | undefined;

    if (files && files.length > 0) {
      imageUrl = await uploadImageToSupabase(
        files[0],
        "banner"
      ); 
    }  

    const updateData: any = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (imageUrl !== undefined) {
      updateData.image_url = imageUrl;
    }

    // If no fields to update, return the existing banner
    if (Object.keys(updateData).length === 0) {
      return banner;
    }

    const updatedBanner = await prisma.banner.update({
      where: { id },
      data: updateData,
    });

    return updatedBanner;
  } catch (error: any) {
    throw new Error(error.message);
  }
}
 
  async deleteBanner(id: string){
        try {
            const banner = await prisma.banner.findUnique({where: {id}})
            if(!banner) throw new Error (`No banner found`)
            await prisma.banner.delete({where: {id}})
            return `Banner deleted successfully`
        } catch (error: any) {
            throw new Error(`${error.message}`)
        }
    }
}  
export default new BannerService