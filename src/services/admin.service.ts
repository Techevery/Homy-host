/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from "../core/utils/prisma";
import Helper from "../core/helpers";
import { uploadImageToSupabase } from "../core/utils/supabase";
import { getAgentById } from "../core/repositories/admin";
import isEmail from "validator/lib/isEmail";
import { deleteImageFromBucket } from "../core/functions";

class AdminService {
  async createAdmin(adminData: {
    name: string;
    email: string; 
    password: string;
    address: string;
    gender: string;
  }) {
    if (!isEmail(adminData.email)) throw new Error("Invalid Email Format");

    const requiredFields = ["name", "email", "password", "address", "gender"];

    const missingFields = requiredFields.filter(
      (field) => !adminData[field as keyof typeof adminData]
    );

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }

    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: adminData.email },
    });

    if (existingAdmin) {
      throw new Error("Admin already exists");
    }

    const hashedPassword = Helper.hash(adminData.password);

    return await prisma.admin.create({
      data: {
        ...adminData,
        password: hashedPassword,
      },
    });
  }

  async authenticateAdmin(email: string, password: string) {
    if (!isEmail(email) || !password) {
      throw new Error("Email and password are required");
    }

    const admin = await prisma.admin.findUnique({ where: { email } });

    if (!admin) throw new Error("Admin not found");

    const isPasswordValid = Helper.correctPassword(password, admin.password);

    if (!isPasswordValid) throw new Error("Invalid credentials");

    const token = Helper.signToken({ id: admin.id, email: admin.email });

    return {
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        address: admin.address,
        gender: admin.gender,
        phonenumber: admin?.phone_number,
      },
    };
  }

  async getAdminProfile(adminId: string) {
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new Error("Admin not found");
    }

    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...adminWithoutPassword } = admin;
    return adminWithoutPassword;
  }

  async updateAdminProfile(
    adminId: string,
    updateData: {
      name?: string;
      address?: string;
      password?: string;
      confirmPassword?: string;
    } 
  ) {
    const { password, confirmPassword, ...restData } = updateData;

    this.validatePasswordChange(password, confirmPassword);

    const updatePayload = password
      ? { ...restData, password: Helper.hash(password) }
      : { ...restData };

    return await prisma.admin.update({
      where: { id: adminId },
      data: updatePayload,
    });
  }

  async createApartment(
    adminId: string,
    apartmentData: {
      name: string;
      address: string;
      type: string;
      servicing: string;
      bedroom: string;
      price: number;
      amenities: string,
      agentPercentage: number
    },
    files?: Express.Multer.File[]
  ) {
    const requiredFields = [
      "name",
      "address",
      "type",
      "servicing",  
      "bedroom",
      "price",
      "amenities",
      "agentPercentage"
    ];

    const missingFields = requiredFields.filter(
      (field) => !apartmentData[field as keyof typeof apartmentData]
    );

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }

    // Upload images if provided
    const imageUrls =
      files && files.length > 0
        ? await Promise.all(
            files.map((file) => uploadImageToSupabase(file, "homey-images"))
          )
        : [];

    return await prisma.apartment.create({
      data: { 
        ...apartmentData,
        images: imageUrls,
        adminId,
      },
    });
  }

  async deleteApartment(apartmentId: string) {
    try {
      const booking = await prisma.apartmentLog.findFirst({
        where: {apartment_id: apartmentId} 
      })
      if(booking) throw new Error("You can not delete appartment that has been booked!")
      const appartment = await prisma.apartment.delete({
        where: { id: apartmentId },
      });

      return 
    } catch (error: any) {
      if ((error as any).code === "P2025") {
        throw new Error("Apartment no found"); 
      }
  
      throw error;
    }
  }

  async updateApartment(
    apartmentId: string,
    updateData: { 
      name?: string;
      address?: string;
      type?: string;
      servicing?: string;
      bedroom?: string;
      price?: number;
    },
    files?: Express.Multer.File[],
    deleteExistingImages: boolean = false
  ) {
    try {
          const existingApartment = await prisma.apartment.findUnique({
      where: { id: apartmentId },
    });

    if (!existingApartment) {
      throw new Error("Apartment not found");
    }

    // handle propert trtrthat has been booked and disawllow update
    const booking = await prisma.apartmentLog.findFirst({
      where: {apartment_id: apartmentId, status: "pending"}
    })

    if(booking) throw new Error("You cannot update appartment that has been booked!")

    // Handle images updated if files are provided 
    const updatedImages = await this.handleImageUpdates(
      existingApartment.images || [],
      files,
      deleteExistingImages
    );


    // Perform the update
    return await prisma.apartment.update({
      where: { id: apartmentId },
      data: {
        ...updateData,
        images: updatedImages,
        updatedAt: new Date(),
      },
    });            
    } catch (error) {
      throw error 
    }
  }

  async listApartments(
    adminId: string,
    page: number = 1,
    pageSize: number = 10
  ) {
    const skip = (page - 1) * pageSize;

    const [apartments, totalCount] = await Promise.all([
      prisma.apartment.findMany({
        where: { adminId },
        skip,
        take: pageSize,
        include: {
          ApartmentLog: {
            orderBy: { created_at: "desc" },
            take: 1,
            select: {
              availability: true,
              status: true,
              booking_start_date: true,
              booking_end_date: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.apartment.count({ where: { adminId } }),
    ]);

    return {
      apartments,
      pagination: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        currentPage: page,
        itemsPerPage: pageSize,
      },
    };
  }

  async searchApartments(searchTerm: string) {
    return await prisma.apartment.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { address: { contains: searchTerm, mode: "insensitive" } },
          { type: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
    });
  }

  async verifyAgent(
    adminId: string,
    agentId: string,
    status: "VERIFIED" | "UNVERIFIED"
  ) {
    // Verify admin exists
    const admin = await prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) {
      throw new Error("Admin not found");
    }

    // Verify agent exists
    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) {
      throw new Error("Agent not found");
    }

    // Update agent status
    return await prisma.agent.update({
      where: { id: agentId },
      data: { status },
    });
  }

  async listAgents(page: number = 1, pageSize: number = 10) {
    const skip = (page - 1) * pageSize;

    const [agents, totalCount] = await Promise.all([
      prisma.agent.findMany({
        skip,
        take: pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          phone_number: true,
          gender: true,
          address: true,
          bank_name: true, 
          account_number: true,
          profile_picture: true,
          id_card: true,
          slug: true,
          createdAt: true,
          updatedAt: true, 
        },
      }),
      prisma.agent.count(),
    ]);

    return {
      agents,
      pagination: {
        totalAgents: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        currentPage: page,
        itemsPerPage: pageSize,
      },
    };
  }

  async getAgentProfiles() {
    const agents = await prisma.agent.findMany();
    if (agents.length === 0) {
      return [];
    }

    return await Promise.all(
      agents.map(async (agent) => {
        const apartments = await prisma.apartment.findMany({
          where: { agents: { some: { id: agent.id } } },
        });

        return {
          agentId: agent.id,
          agentName: agent.name,
          agentStatus: agent.status,
          personalizedUrl: `${process.env.AGENT_BASE_URL}/${agent.slug}/properties`,
          apartmentManaged: apartments.length,
          agentEmail: agent.email,
          accountNumber: agent.account_number,
          idCard: agent.id_card,
          passport: agent.profile_picture,
        };
      })
    );
  }

  async getAgentProfileById(agentId: string) {
    const agent = await getAgentById(agentId);

    if (!agent) throw new Error("Agent account not found");

    const personalizedURL = `${process.env.AGENT_BASE_URL}/${agent.slug}/properties`;

    return {
      agentName: agent.name,
      agentEmail: agent.email,
      agentPhone: agent.phone_number,
      agentURL: personalizedURL,
    };
  }

  private validatePasswordChange(password?: string, confirmPassword?: string) {
    if (!password && !confirmPassword) return;

    if (password && !confirmPassword)
      throw new Error("Confirm password is required when changing password");

    if (!password && confirmPassword)
      throw new Error("Password is required when providing confirm password");

    if (password !== confirmPassword)
      throw new Error("Password and confirm password  do not match");
  }

  private async handleImageUpdates(
    existingImages: string[],
    newFiles?: Express.Multer.File[],
    shouldDeleteExisting = false
  ): Promise<string[]> {
    let images = [...existingImages];

    // Early return if no image changes needed
    if (!newFiles?.length && !shouldDeleteExisting) return images;

    // Delete existing images if requested
    if (shouldDeleteExisting && images.length > 0) {
      await Promise.all(images.map((url) => deleteImageFromBucket(url)));

      images = [];
    } 

    // Add new images if provided
    if (newFiles?.length) {
      const newImageUrls = await Promise.all(
        newFiles.map((file) => uploadImageToSupabase(file, "apartments"))
      );
      images = [...images, ...newImageUrls];
    }

    return images;
  }
}

export default new AdminService();
