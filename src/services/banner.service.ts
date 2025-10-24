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

    async deleteBanner(id: string){
        
    }
}  
export default new BannerService