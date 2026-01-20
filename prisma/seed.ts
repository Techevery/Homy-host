import prisma from "../src/core/utils/prisma";
// import { info, error as logError } from "../src/core/helpers/logger";
import Helper from "../src/core/helpers";
import { Role } from "@prisma/client";

async function main() {
  try {   
    console.log("....Seeding Admin....")

    const admin = await prisma.admin.findFirst({
      where: { email: "admin@dev.com" },
    });
  
    const hashedPassword = Helper.hash("adminpassword", 10);
  
    if (!admin) {    
      const adminData = await prisma.admin.create({
        data: {
          name: "Super Admin",
          email: "techeveryng@gmail.com",  
          password: hashedPassword,
          address: "Admin's office",
          gender: "Male",
          role: "SUPER_ADMIN"
        },
      });
  
      // info({
      //   message: "Admin created",
      //   params: { adminData },
      // });

      console.info("....seeding completed....")

    } else {
      console.log("Admin already exists");
      // info({
      //   message:"Admin already exists, no creation needed",
      //   params:{admin}
      // });
    }
    
  } catch (error) {
    if(error instanceof Error){
      // logError({
      //   message:"Error occurred during seeding",
      //   params:{
      //     name:error.name,
      //     message:error.message,
      //     stack:error.stack
      //   }
      // })
    };

    throw error;
  }
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
