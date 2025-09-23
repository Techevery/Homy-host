import prisma from "../core/utils/prisma";

class PropertyService {
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
          skip,
          take: limit,
        },
      },
    });

    if (!agent) throw new Error("Agent not found");

    const totalCount = await prisma.apartment.count({
      where: { agents: { some: { id: agent.id } } },
    });

    return {
      agent: {
        name: agent.name,
        email: agent.email,
        image: agent.profile_picture,
      },
      properties: agent.apartment,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }
}

export default new PropertyService()

// if markup put amount when the use goess to see the propertty hhe sees the original price plus the markup price 
// during uploading of an appartnent  by admin the should have agent fee wouuld bbe added