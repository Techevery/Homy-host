import prisma from "./prisma";
import generateUniqueSlug from "./slug";

const updateAgentSlugs = async () => {
  try {
    const agents = await prisma.agent.findMany();

    for (const agent of agents) {
      const newSlug = await generateUniqueSlug(agent.name);

      await prisma.agent.update({
        where: { id: agent.id },
        data: { slug: newSlug },
      });

      console.log(`Updated slug for agent ${agent.name}: ${newSlug}`);
    }

    console.log("All agent slugs have been updated successfully.");
  } catch (error) {
    console.error("Error updating agent slugs:", error);
  } finally {
    await prisma.$disconnect();
  }
};

updateAgentSlugs();
