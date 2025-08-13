import prisma from "../utils/prisma";
import Helper from "../helpers";
import { supabase } from "../utils/supabase";
import { logger } from "../helpers/logger";

interface CreateAdminInput {
  name: string;
  email: string;
  password: string;
  address: string;
  gender: string;
}

interface UpdateAdminInput {
  name?: string;
  address?: string;
  password?: string;
}

interface CreateApartmentInput {
  name: string;
  address: string;
  type: string;
  servicing: string;
  bedroom: string;
  price: number;
  adminId: string;
  files: Express.Multer.File[];
}

export const createAdmin = async (input: CreateAdminInput) => {
  const { name, email, password, address, gender } = input;

  const hashedPassword = Helper.hash(password);

  const admin = await prisma.admin.create({
    data: {
      name,
      email,
      password: hashedPassword,
      address,
      gender,
    },
  });

  const { password: _, ...adminDataWithoutPassword } = admin;
  console.log("Created Admin:", _);
  return adminDataWithoutPassword;
};

export const getAdminByEmail = async (email: string) => {
  const admin = await prisma.admin.findUnique({
    where: {
      email,
    },
  });

  return admin;
};

export const getAdminById = async (id: string) => {
  const admin = await prisma.admin.findUnique({
    where: {
      id,
    },
  });

  return admin;
};

export const getAgentById = async (id: string) => {
  const agent = await prisma.agent.findUnique({
    where: {
      id,
    },
  });

  return agent;
};

export const getAdmins = async () => {
  const admins = await prisma.admin.findMany();

  return admins;
};

export const updateAdmin = async (id: string, input: UpdateAdminInput) => {
  const { name, password, address } = input;

  const hashedPassword = password ? Helper.hash(password) : undefined;

  const admin = await prisma.admin.update({
    where: {
      id,
    },
    data: {
      name,
      password: hashedPassword,
      address,
    },
  });

  const { password: _, ...adminDataWithoutPassword } = admin;

  console.log("Updated Admin:", _);
  return adminDataWithoutPassword;
};

export const deleteAdmin = async (id: string) => {
  const admin = await prisma.admin.delete({
    where: {
      id,
    },
  });

  return admin;
};

export const createApartment = async (input: CreateApartmentInput) => {
  const { name, address, type, servicing, bedroom, price, adminId, files } =
    input;

  const uploadImages: string[] = [];

  try {
    // Upload images to Supabase

    for (const file of files) {
      const fileName = `${Date.now()}-${file.originalname}`;
      const { data, error } = await supabase.storage
        .from("homey-images")
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) {
        console.error("Error uploading to Supabase:", error.message);
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from("homey-images")
        .getPublicUrl(data.path);

      if (publicUrlData) {
        uploadImages.push(publicUrlData.publicUrl);
      }
    }

    console.log("Upload images URLs:", uploadImages);

    const apartment = await prisma.apartment.create({
      data: {
        name,
        address,
        type,
        servicing,
        bedroom,
        price,
        images: uploadImages,
        createdBy: { connect: { id: adminId } },
      },
    });

    return apartment;
  } catch (error) {
    if (error instanceof Error) {
      logger.error({
        message: "Error creating apartment",
        params: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      });
    }

    throw error;
  }
};

export const updateAgentStatus = async (
  agentId: string,
  status: "VERIFIED" | "UNVERIFIED"
) => {
  const agent = await prisma.agent.update({
    where: {
      id: agentId,
    },
    data: {
      status,
    },
  });
  return agent;
};

export const listAgents = async (skip: number, take: number) => {
  return prisma.agent.findMany({
    skip,
    take,
    select: {
      id: true,
      name: true,
      email: true,
      phone_number: true,
      status: true,
      createdAt: true,
      apartment: true,
      slug: true,
    },
  });
};

export const countAgents = async () => {
  return prisma.agent.count();
};

export const findProperties = async (
  adminId: string,
  skip: number,
  take: number
) => {
  return prisma.apartment.findMany({
    skip,
    take,
    where: {
      createdBy: { id: adminId },
    },
    include: { createdBy: true },
  });
};

export const countProperties = async (adminId: string) => {
  return prisma.apartment.count({
    where: { createdBy: { id: adminId } },
  });
};

export const findPropertyById = async (propertyId: string) => {
  return prisma.apartment.findUnique({
    where: { id: propertyId },
    include: { createdBy: true },
  });
};

export const searchApartments = async (query: string) => {
  return prisma.apartment.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { address: { contains: query, mode: "insensitive" } },
        { type: { contains: query, mode: "insensitive" } },
        { servicing: { contains: query, mode: "insensitive" } },
      ],
    },
  });
};

export const deleteApartment = async (id: string) => {
  return prisma.apartment.delete({
    where: { id },
  });
};
