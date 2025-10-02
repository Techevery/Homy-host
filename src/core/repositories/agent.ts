import prisma from "../utils/prisma";
import Helper from "../helpers";

interface CreateAgentInput {
  name: string;
  email: string;
  password: string;
  address: string;
  gender: string;
  phone_number: string;
  bank_name: string;
  account_number: string;
  slug: string;
  profile_picture?: string;
  id_card?: string;
  personalUrl: string
}

export const createAgent = async (input: CreateAgentInput) => {
  const {
    name,
    email,
    password,
    address,
    gender,
    phone_number,
    bank_name,
    account_number,
    profile_picture,
    id_card,
    slug,
  } = input;

  const existingAccount = await prisma.agent.findUnique({
    where: { email },
  });

  if (existingAccount) throw new Error("Account already exist");

  const hashedPassword = Helper.hash(password);

  const agent = await prisma.agent.create({
    data: {
      name,
      email,
      password: hashedPassword,
      address,
      gender,
      phone_number,
      bank_name,
      account_number,
      profile_picture,
      id_card,
      slug,
      personalUrl: "agent"
    },
  });

  return agent;
};

export const getAgentById = async (id: string) => {
  const agent = await prisma.agent.findUnique({
    where: {
      id,
    },
  });

  return agent;
};

export const getAgentByEmail = async (email: string) => {
  const agent = await prisma.agent.findUnique({
    where: {
      email,
    },
  });

  return agent;
};

export const checkExistingAgent = async (email: string) => {
  const exisitingAccount = await prisma.agent.findUnique({
    where: {
      email,
    },
  });

  return exisitingAccount;
};

export const getAgentStatus = async (id: string) => {
  return prisma.agent.findUnique({
    where: {
      id,
    },
    select: {
      status: true,
    },
  });
};

export const getAgents = async () => {
  const agents = await prisma.agent.findMany();

  return agents;
};

export const updateAgent = async (id: string, input: CreateAgentInput) => {
  const {
    name,
    email,
    password,
    address,
    phone_number,
    bank_name,
    account_number,
  } = input;

  const hashedPassword = Helper.hash(password);

  const agent = await prisma.agent.update({
    where: {
      id,
    },
    data: {
      name,
      email,
      password: hashedPassword,
      address,
      phone_number,
      bank_name,
      account_number,
    },
  });

  return agent;
};

export const getAgentEnlistedProperties = async (agentId: string) => {
  const properties = await prisma.agent.findUnique({
    where: {
      id: agentId,
    },
    select: {
      apartment: true,
    },
  });

  return properties;
};

export const linkApartmentToAgent = async (
  agentId: string,
  apartmentId: string
) => {
  return prisma.agent.update({
    where: { id: agentId },
    data: {
      apartment: {
        connect: { id: apartmentId },
      },
    },
  });
};

export const checkAgentApartmentExists = async (
  agentId: string,
  apartmentId: string
) => {
  return prisma.agent.findFirst({
    where: {
      id: agentId,
      apartment: {
        some: { id: apartmentId },
      },
    },
  });
};

export const getApartmentById = async (id: string) => {
  return prisma.apartment.findUnique({
    where: {
      id,
    },
  });
};

export const getApartmentPrice = async (apartmentId: string) => {
  return prisma.apartment.findUnique({
    where: {
      id: apartmentId,
    },
    select: {
      price: true,
      name: true,
      servicing: true,
      bedroom: true,
    },
  });
};

export const getAgentApartment = async (agentId: string) => {
  return prisma.agent.findUnique({
    where: {
      id: agentId,
    },
    select: {
      apartment: true,
    },
  });
};

export const removeAgentApartment = async (
  agentId: string,
  apartmentId: string
) => {
  return prisma.agent.update({
    where: {
      id: agentId,
    },
    data: {
      apartment: {
        disconnect: { id: apartmentId },
      },
    },
  });
};

export const removeAgent = async (id: string) => {
  return prisma.agent.delete({
    where: {
      id,
    },
  });
};

export const getApartmentAgent = async (apartmentId: string) => {
  return prisma.apartment.findUnique({
    where: {
      id: apartmentId,
    },
    select: {
      agents: true,
    },
  });
};

export const createAgentListing = async (
  apartmentId: string,
  agentId: string,
  markupPrice: number
) => {
  const apartment = await getApartmentById(apartmentId);

  if (!apartment) throw new Error("Apartment not found");

  const basePrice = apartment?.price;

  return prisma.agentListing.create({
    data: {
      agent_id: agentId,
      apartment_id: apartmentId,
      markedup_price: markupPrice,
      base_price: basePrice,
      price_changed_by: agentId,
    },
  });
};
