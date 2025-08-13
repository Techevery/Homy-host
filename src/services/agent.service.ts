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
      personalUrl: string
    },
    files?: {
      profile_picture?: Express.Multer.File[];
      id_card?: Express.Multer.File[];
    }
  ) {
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
      "personalUrl"
    ];

    const missingFields = requiredFields.filter(
      (field) => !agentData[field as keyof typeof agentData]
    );

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }

    const existingAgent = await prisma.agent.findUnique({
      where: { email: agentData.email },
    });

    if (existingAgent) {
      throw new Error("Account already in use");
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

    const slug = await generateUniqueSlug(agentData.name);

    const agent = await prisma.agent.create({
      data: {
        ...agentData,
        profile_picture: imageUrl,
        id_card: kycUrl,
        slug,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...agentWithoutPassword } = agent;
    return agentWithoutPassword;
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
    markedUpPrice?: number
  ) {
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

    const finalPrice =
      markedUpPrice && markedUpPrice >= apartment.price
        ? markedUpPrice
        : apartment.price;

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
          base_price: apartment.price,
          markedup_price: finalPrice,
        },
      }),
    ]);
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
          markedUpPrice: listing.markedup_price ?? listing.base_price,
          priceChangedAt: listing.price_changed_at,
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
