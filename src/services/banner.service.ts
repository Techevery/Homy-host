import prisma from "../core/utils/prisma";
import { uploadImageToSupabase } from "../core/utils/supabase";

class BannerService{
    async createBanner(name: string, description: string, agentId: any, files: Express.Multer.File[]){
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

    async fetchBanner(agentId: any){
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
  name: string,
  description: string,
  agentId: string,
  files: Express.Multer.File[]
) {
  try {
    const banner = await prisma.banner.findUnique({ where: { id } });
    if (!banner) throw new Error("Banner not found");

    // Handle file upload logic (e.g., upload to cloud, get URLs)
 try {
                let imageUrl: string | any;

                if (files [0]) {
                  imageUrl = await uploadImageToSupabase(
                    files[0],
                    "banner"
                  ); 
                }  

    const updatedBanner = await prisma.banner.update({
      where: { id },
      data: {
        name: name || banner.name,
        description: description || banner.description,
        image_url: imageUrl || banner.image_url,
      },
    });

    return updatedBanner;
  } catch (error: any) {
    throw new Error(error.message);
  }
}  catch (error: any) {
    throw new Error(`${error.message}`);
  }
}
 
  async deleteBanner(id: string, agentId: string){
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