import prisma from "../core/utils/prisma";
import { uploadImageToSupabase } from "../core/utils/supabase";
import generateUniqueSlug from "../core/utils/slug";
import Helper from "../core/helpers";
import isEmail from "validator/lib/isEmail";
import account_number from "validator/lib/isNumeric";
import { findBankByName } from "../core/functions/bank";
// import * as validator from "../core/utils/validator";

interface UpdateBannerParams {
  bannerId: string;
  agentId: string;
  name?: string;
  description?: string;
  files?: Express.Multer.File[];
}

class AgentService {     
  async registerAgent(    
    agentData: {
      name: string;
      email: string;
      password: string;
      address: string; 
      gender: string; 
      phone_number: string;
      bank_name: string;
      account_number: string;
      personalUrl: string;
      nextOfKinName: string;
      nextOfKinPhone: string;
      nextOfKinAddress: string;
      nextOfKinEmail: string;
      nextOfKinStatus: string;
      nextOfKinOccupation: string;  
    },
    files?: {
      profile_picture?: Express.Multer.File[];
      id_card?: Express.Multer.File[];
    }
  ) { 
    try {
      if (!isEmail(agentData.email)) throw new Error("Invalid Email format");

    const bank = findBankByName(agentData.bank_name);

    if (!bank)
      throw new Error(
        "Invalid Bank name, Please provide a valid Nigerian Bank"
      );

    if (!account_number(agentData.account_number)) 
      throw new Error("Account number must be 10 digits long");

    const requiredFields = [
      "name",
      "email",
      "password",      
      "address",
      "gender",
      "phone_number",
      "bank_name",
      "account_number",
      "personalUrl",
      "nextOfKinName",
      "nextOfKinPhone",
      "nextOfKinAddress",
      "nextOfKinEmail",
      "nextOfKinStatus",
      "nextOfKinOccupation"
    ];

    const missingFields = requiredFields.filter(
      (field) => !agentData[field as keyof typeof agentData]
    );

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    } 

    const existingAgent = await prisma.agent.findUnique({
      where: { email: agentData.email || agentData.personalUrl },
    });

    if (existingAgent) {
      throw new Error("Email or Personal URL already in use");
    }

    let imageUrl: string | undefined = undefined;
    let kycUrl: string | undefined = undefined;

    if (files?.profile_picture?.[0]) {
      imageUrl = await uploadImageToSupabase(
        files.profile_picture[0],
        "agents"
      ); 
    }

    if (files?.id_card?.[0]) {
      kycUrl = await uploadImageToSupabase(files.id_card[0], "kyc");
    }

    const slug = await generateUniqueSlug(agentData.personalUrl); 

    const agent = await prisma.agent.create({ 
      data: {    
        ...agentData,
        personalUrl: `${process.env.AGENT_BASE_URL}/${slug}`, 
        password: Helper.hash(agentData.password), 
        profile_picture: imageUrl, 
        id_card: kycUrl,
        slug,   
      },  
    }); 

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...agentWithoutPassword } = agent;
    return agentWithoutPassword;

    } catch (error: any) {  
      console.log(error)
      throw new Error(`Something went wrong. ${error instanceof Error ? error.message : ''}`);
    } 

  } 

  async agetProfile(agent: any){
    const data = {
      id: agent.id,
      name: agent.name,
      email: agent.email,
      phoneNumber: agent.phone_number,
      gender: agent.gender,
      avatar: agent.profile_picture,
      personalUrl: agent.personalUrl,
      nextOfKinName: agent.nextOfKinName,
      nextOfkinEmail: agent.nextOfKinEmail,
      address: agent.address,
      accountBalance: agent.accountBalance,
      status: agent.status,
      bankName: agent.bank_name,
      accountNumber: agent.account_number,
      idCard: agent.id_card   
    }       
    return data   
  }  

async updateAgentProfile(
  agentId: string,
  agentData: {
    personalUrl?: string;
    nextOfKinName?: string;
    nextOfKinPhone?: string;
    nextOfKinAddress?: string;
    nextOfKinEmail?: string;
    nextOfKinStatus?: string; 
    nextOfKinOccupation?: string;  
  },
  files?: {
    profile_picture?: Express.Multer.File[];
    id_card?: Express.Multer.File[];
  }
) { 
  try {
    // Check if agent exists
    const existingAgent = await prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!existingAgent) {
      throw new Error("Agent not found");
    }


    // Check for unique email and personalUrl if being updated
    if (agentData.personalUrl) {
      const duplicateAgent = await prisma.agent.findFirst({
        where: {
          OR: [
            ...(agentData.personalUrl ? [{ personalUrl: agentData.personalUrl }] : []),
          ],
          NOT: {
            id: agentId,
          },
        },
      });

      if (duplicateAgent) {
        throw new Error("Email or Personal URL already in use by another agent");
      }
    }

    let imageUrl: string | undefined = undefined;
    let kycUrl: string | undefined = undefined;

    // Handle profile picture upload
    if (files?.profile_picture?.[0]) {
      imageUrl = await uploadImageToSupabase(
        files.profile_picture[0],
        "agents"
      ); 
    }

    // Handle ID card upload
    if (files?.id_card?.[0]) {
      kycUrl = await uploadImageToSupabase(files.id_card[0], "kyc");
    }

    // Handle personal URL slug generation if personalUrl is being updated
    let slug = existingAgent.slug;
    let finalPersonalUrl = existingAgent.personalUrl;
    
    if (agentData.personalUrl && agentData.personalUrl !== existingAgent.personalUrl) {
      slug = await generateUniqueSlug(agentData.personalUrl);
      finalPersonalUrl = `${process.env.AGENT_BASE_URL}/${slug}`;
    }

    // Prepare update data
    const updateData: any = {
      ...agentData,
    };

    // Only include fields that are being updated
    if (agentData.personalUrl) {
      updateData.personalUrl = finalPersonalUrl;
      updateData.slug = slug;
    }

    if (imageUrl) {
      updateData.profile_picture = imageUrl;
    }

    if (kycUrl) {
      updateData.id_card = kycUrl;
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const agent = await prisma.agent.update({
      where: { id: agentId },
      data: updateData,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...agentWithoutPassword } = agent;
    return agentWithoutPassword;

  } catch (error: any) {  
    console.log(error);
    throw new Error(`Something went wrong. ${error instanceof Error ? error.message : ''}`);
  } 
}

  async getAllPublicProperties(page: number, limit: number) {
    const properties = await prisma.apartment.findMany({
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalCount = await prisma.apartment.count();

    return {
      properties,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
    }; 
    } 
                      
  async authenticateAgent(email: string, password: string) {
    if (!isEmail(email) || !password) {
      throw new Error("Email and password are required");
    }

    const agent = await prisma.agent.findUnique({
      where: { email },
    });

    if (!agent) {
      throw new Error("Account not found");
    }

    const isPasswordValid = Helper.correctPassword(password, agent.password);

    if (!isPasswordValid) throw new Error("Invalid credentials");

    const token = Helper.signToken({ id: agent?.id, email: agent?.email });
  
    // verify personal url details and slugify them incase of spaces

    return {    
      token,  
      agent: {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        status: agent.status,
        slug: agent.slug,
        image: agent.profile_picture,
        personalURL: `${process.env.AGENT_BASE_URL}/${agent.slug}/properties`,
      },
    };
  }


async addPropertyToListing(
  agentId: string,
  apartmentId: string,
  markedUpPrice?: number,
  agentPercentage?: number
) {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: { status: true },
    });

    if (!agent) throw new Error("Agent not found");

    if (agent.status !== "VERIFIED")
      throw new Error("Agent account is not verified");

    const apartment = await prisma.apartment.findUnique({
      where: { id: apartmentId },
    });

    if (!apartment) throw new Error("Apartment not found");

    const existingListing = await prisma.agentListing.findUnique({
      where: {
        unique_Agent_apartment: {
          agent_id: agentId,
          apartment_id: apartmentId,
        },
      },
    });

    if (existingListing)
      throw new Error("Apartment already listed by this agent");

    // Prevent both inputs from being provided
    if (markedUpPrice !== undefined && agentPercentage !== undefined) {
      throw new Error("Cannot provide both markedUpPrice and agentPercentage");
    }

    // Calculate the final marked-up price (selling price) and commission
    let finalPrice: number;
    let commissionPercentage: number | null = null;
    let basePrice: number;

    if (agentPercentage !== undefined) {   
      if (agentPercentage <= 0 || agentPercentage > 100) {
        throw new Error("Agent percentage must be between 0 and 100");
      }
      finalPrice = 0; 
      commissionPercentage = agentPercentage; 
      basePrice = apartment.price;
    } else if (markedUpPrice !== undefined) {
      if (markedUpPrice < 0) {
        throw new Error("Marked-up price cannot be negative");
      }
      finalPrice = markedUpPrice;
      commissionPercentage = null;
      basePrice = markedUpPrice + apartment.price;
    } else {
      finalPrice = 0;
      commissionPercentage = null;
      basePrice = apartment.price;
    }

    return await prisma.$transaction([  
      prisma.agent.update({
        where: { id: agentId },
        data: {
          apartment: { connect: { id: apartmentId } },
        }, 
      }),
      prisma.agentListing.create({
        data: {
          apartment_id: apartmentId, 
          agent_id: agentId,
          base_price: basePrice,
          markedup_price: finalPrice,
          agent_commission_percent: commissionPercentage,
        },
      }),
    ]);    
  } catch (error: any) {
    throw new Error(`${error.message}`) 
  }
}  

  async removePropertyFromListing(agentId: string, apartmentId: string) {
    const listing = await prisma.agentListing.findUnique({   
      where: {
        unique_Agent_apartment: {
          agent_id: agentId,
          apartment_id: apartmentId,  
        },
      },
    });

    if (!listing) {
      throw new Error("Listing not found");
    }

    await prisma.agent.update({
      where: {
        id: agentId,
      },  
      data: {
        apartment: { disconnect: { id: apartmentId } },
      },
    });


    return await prisma.agentListing.delete({ 
      where: {id: listing.id, agent_id: agentId}
    })
  }

  //  cheking booking daily this can only happen with cron job  
  // the agent would only get credited when the end time reach 

  async getAgentProperties(
  agentId: string,
  page: number = 1,
  limit: number = 10
) {
  const skip = (page - 1) * limit;

  const [totalCount, listings] = await Promise.all([
    prisma.apartment.count({
      where: { agents: { some: { id: agentId } } },
    }),
    prisma.agentListing.findMany({
      where: { agent_id: agentId },
      include: {
        apartment: {
          select: {
            id: true,
            name: true,
            address: true,
            type: true,
            servicing: true,
            bedroom: true,
            price: true,
            images: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        agent: {
          select: {id: true}
        },        
      },
      skip,
      take: limit,
    }),
  ]);

  return {
    totalCount,
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    properties: listings.map((listing) => ({
      ...listing.apartment,
      agentPricing: {
        basePrice: listing.base_price,
        markedUpPrice: listing.markedup_price,
        priceChangedAt: listing.price_changed_at,
        total: listing.markedup_price ? listing.base_price + listing.markedup_price : listing.base_price
      },
      listingId: listing.id,
    })), 
    agentId: agentId,
  };
}

  async getAgentPropertiesBySlug(
    slug: string,
    page: number = 1,
    limit: number = 10
  ) { 
    const skip = (page - 1) * limit;

    const agent = await prisma.agent.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        phone_number: true,
        personalUrl: true,
        createdAt: true,
        profile_picture: true,
        suspended: true,
        AgentBanner: {
        select: {
            id: true,
            name: true,
            image_url: true,
            description: true,
          },
        },
      },
    });

    if (!agent || agent.suspended === true) throw new Error("Agent not found or agent suspended!");

    const listing = await prisma.agentListing.findMany({
      where: { agent_id: agent.id },
      skip,
      take: limit,
      include: {
        apartment: {
          select: {
            id: true,
            name: true,
            address: true,
            type: true,
            servicing: true,
            bedroom: true,
            amenities: true,
            price: true, // base price
            images: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    const totalCount = await prisma.apartment.count({
      where: { agents: { some: { id: agent.id } } },
    });

    const properties = listing.map((listing) => {
      const apartment = listing.apartment;
      const finalPrice = listing.markedup_price ? listing.markedup_price + apartment.price : apartment.price;
    
      return {
        ...apartment,
        price: finalPrice
      };
    });

    return {
      agent: { 
        id: agent.id,
        name: agent.name,
        email: agent.email,
        image: agent.profile_picture,
        contact: agent.phone_number,
        createdAt: agent.createdAt,
        status: agent.status,
      },
      banners: agent.AgentBanner,
      properties,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  async createBanner(name: string, description: string, agentId: string, files: Express.Multer.File[]){
    try {
         const imageUrls =
            files && files.length > 0
              ? await Promise.all(
                  files.map((file) => uploadImageToSupabase(file, "agent-banner"))
                )
              : [];
        const banner = await prisma.agentBanner.create({
            data: {
                name,
                description,
                agentId,
                image_url: imageUrls[0]
            }
        })
        return banner
    } catch (error) {
      throw new Error(`Something went wrong. ${error instanceof Error ? error.message : ''}`);
    }
  }

  async fetchBanner(agentId: any) {
      try {
          const banners = await prisma.agentBanner.findMany({
            where: { agentId }
          })
          return banners
      } catch (error: any) {
          throw new Error(`${error.message}`)
      }
}

async updateBanner(params: UpdateBannerParams) {
  const { bannerId, agentId, name, description, files } = params;

  const banner = await prisma.agentBanner.findUnique({
    where: { id: bannerId },
  });

  if (!banner) {
    throw new Error("Banner not found");
  }

  if (banner.agentId !== agentId) {
    throw new Error("Unauthorized: You don't own this banner");
  }

  // Build dynamic update data — only include fields that are provided
  const updateData: any = {};

  if (name !== undefined && name !== '') {
    updateData.name = name;
  }

  if (description !== undefined) { // description is optional in schema
    updateData.description = description === '' ? null : description;
  }

  // Handle image update only if new files are uploaded
  if (files && files.length > 0) {
    const imageUrls = await Promise.all(
      files.map((file) => uploadImageToSupabase(file, "agent-banner"))
    );
    updateData.image_url = imageUrls[0]; // assuming single image
  }

  // If nothing to update
  if (Object.keys(updateData).length === 0) {
    return banner; // return unchanged
  }

  // Perform update
  return await prisma.agentBanner.update({
    where: { id: bannerId },
    data: updateData,
  });
}

async deleteBanner(id: string, agentId: any) {
 try {
  const banner = await prisma.agentBanner.findUnique({ where: { id } });
  if (!banner) throw new Error("Banner not found");
  
  const deleteAgentBanner = await prisma.agentBanner.delete({
    where: { id, agentId }
  })
  if(!deleteAgentBanner) throw new Error("Unable to delete banner")
  return `Banner deleted successfully`
 } catch (error) {
  
 }
}

}

export default new AgentService();