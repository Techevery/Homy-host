import slugify from "slugify";
import prisma from "./prisma";

const generateUniqueSlug = async (name: string) => {
  const { nanoid } = await import("nanoid");

  let slug = "";
  let isUnique = false;

  while (!isUnique) {
    const baseSlug = slugify(name, { lower: true, strict: true });
    const uniqueId = nanoid(6);
    slug = `${baseSlug}-${uniqueId}`;

    const exisitingAgent = await prisma.agent.findUnique({
      where: { slug },
    });

    if (!exisitingAgent) {
      isUnique = true;
    }
  }

  return slug as string;
};

export default generateUniqueSlug;
