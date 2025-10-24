import prisma from "../core/utils/prisma";
import { uploadImageToSupabase } from "../core/utils/supabase";
import generateUniqueSlug from "../core/utils/slug";
import Helper from "../core/helpers";
import isEmail from "validator/lib/isEmail";
import account_number from "validator/lib/isNumeric";
import { findBankByName } from "../core/functions/bank";
// import * as validator from "../core/utils/validator";

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
      accountNumber: agent.account_number    
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

// async addPropertyToListing(
//   agentId: string,
//   apartmentId: string,
//   markedUpPrice?: number,
//   agentPercentage?: number
// ) {
//   try {
//       const agent = await prisma.agent.findUnique({
//     where: { id: agentId },
//     select: { status: true },
//   });

//   if (!agent) throw new Error("Agent not found");

//   if (agent.status !== "VERIFIED")
//     throw new Error("Agent account is not verified");

//   const apartment = await prisma.apartment.findUnique({
//     where: { id: apartmentId },
//   });

//   if (!apartment) throw new Error("Apartment not found");

//   const existingListing = await prisma.agentListing.findUnique({
//     where: {
//       unique_Agent_apartment: {
//         agent_id: agentId,
//         apartment_id: apartmentId,
//       },
//     },
//   });

//   if (existingListing)
//     throw new Error("Apartment already listed by this agent");

//   // Prevent both inputs from being provided
//   if (markedUpPrice !== undefined && agentPercentage !== undefined) {
//     throw new Error("Cannot provide both markedUpPrice and agentPercentage");
//   }

//   // Calculate the final marked-up price (selling price) and commission
//   let finalPrice: number;
//   let commissionPercentage: number | null = null;
//   let totalPrice: number | null 

//   if (agentPercentage !== undefined) {   
//     if (agentPercentage <= 0 || agentPercentage > 100) {
//       throw new Error("Agent percentage must be between 0 and 100");
//     }
//     finalPrice = 0; 
//     commissionPercentage = agentPercentage; 
//   } else if (markedUpPrice !== undefined) {
//     if (markedUpPrice && markedUpPrice < apartment.price) {
//       // throw new Error("Marked-up price cannot be greater than the original apartment price");
//       totalPrice = markedUpPrice + apartment.price

//       // handle this latter
//     }
//     finalPrice = markedUpPrice;
//     commissionPercentage = null;
//   } else {
//     // finalPrice = apartment.price;
//     finalPrice = 0;
//     commissionPercentage = null;
//   }

//   return await prisma.$transaction([  
//     prisma.agent.update({
//       where: { id: agentId },
//       data: {
//         apartment: { connect: { id: apartmentId } },
//       }, 
//     }),
//     prisma.agentListing.create({
//       data: {
//         apartment_id: apartmentId, 
//         agent_id: agentId, 
//         base_price: markedUpPrice ? totalPrice : apartment.price, 
//         markedup_price: finalPrice,
//         agent_commission_percent: commissionPercentage,  // Store the percentage if applicable
//       },
//     }),
//   ]); 
//   } catch (error: any) {
//     throw new Error(`${error.message}`)
//   }
// }

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

    return await prisma.agent.update({
      where: {
        id: agentId,
      },  
      data: {
        apartment: { disconnect: { id: apartmentId } },
      },
    });
  }

  //  cheking booking daily this can only happen with cron job  
  // the agent would only get credited when the end time reach 

  // async getAgentProperties(
  //   agentId: string,
  //   page: number = 1,
  //   limit: number = 10
  // ) {
  //   const skip = (page - 1) * limit;

  //   const [totalCount, listings] = await Promise.all([
  //     prisma.apartment.count({
  //       where: { agents: { some: { id: agentId } } },
  //     }),
  //     prisma.agentListing.findMany({
  //       where: { agent_id: agentId },
  //       include: {
  //         apartment: {
  //           select: {
  //             id: true,
  //             name: true,
  //             address: true,
  //             type: true,
  //             servicing: true,
  //             bedroom: true,
  //             price: true,
  //             images: true,
  //             createdAt: true,
  //             updatedAt: true,
  //           },
  //         },
  //       },
  //       skip,
  //       take: limit,
  //     }),
  //   ]);

  //   return {
  //     totalCount,
  //     currentPage: page,
  //     totalPages: Math.ceil(totalCount / limit),
  //     properties: listings.map((listing) => ({
  //       ...listing.apartment,
  //       agentPricing: {
  //         basePrice: listing.base_price,
  //         markedUpPrice: listing.markedup_price ?? listing.base_price,
  //         priceChangedAt: listing.price_changed_at,
  //         total: 
  //       },
  //       listingId: listing.id,
  //     })), 
  //     agentId: agentId,
  //   };
  // }

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
        profile_picture: true,
      },
    });

    if (!agent) throw new Error("Agent not found");

    const listing = await prisma.agentListing.findMany({
      where: { agent_id: agent.id },
      skip,
      take: limit,
      include: {
        apartment: {
          select: {
            id: true,
            address: true,
            type: true,
            servicing: true,
            bedroom: true,
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
      return {
        ...apartment,
        price: listing.markedup_price ?? apartment.price,
      };
    });

    return {
      agent: {
        name: agent.name,
        email: agent.email,
        image: agent.profile_picture,
      },
      properties,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }
}

export default new AgentService();