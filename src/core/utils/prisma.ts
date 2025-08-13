import { PrismaClient } from "@prisma/client";

export class PrismaSingleton {
  private static instance: PrismaClient;

  public static getInstance(): PrismaClient {
    if(!PrismaSingleton.instance){
      PrismaSingleton.instance = new PrismaClient();
    }

    return PrismaSingleton.instance;
  }
}

const prisma = PrismaSingleton.getInstance();
export default prisma;