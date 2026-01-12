import { z } from "zod";

export const updateApartmentSchema = z
  .object({
    name: z.string().optional(),
    address: z.string().optional(),
    type: z.enum(["Flat", "House", "Apartment", "Villa"]).optional(),
    amenities: z.string().optional(),
    location: z.string().optional(),
    agentPercentage: z.string()
      .regex(/^\d+$/, "Agent percentage must be a valid non-negative integer")
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().min(0))
      .optional(),
    servicing: z.string().optional(),
    bedroom: z.string().optional(),
    price: z.string()
      .regex(/^\d+$/, "Price must be a valid non-negative integer")
      .transform((val) => parseInt(val, 10))
      .pipe(z.number().min(0))
      .optional(),
    deleteExistingImages: z.boolean().optional(),      
  });

export type UpdateApartmentInput = z.infer<typeof updateApartmentSchema>;