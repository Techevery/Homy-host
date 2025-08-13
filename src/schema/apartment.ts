import { z } from "zod";

export const updateApartmentSchema = z
  .object({
    name: z.string().optional(),
    address: z.string().optional(),
    type: z.enum(["Studio", "1BR", "2BR", "3BR", "Penthouse"]).optional(),
    servicing: z.string().optional(),
    bedroom: z.string().optional(),
    price: z.number().min(0).optional(),
    deleteExistingImages: z.boolean().optional(),
  })
  .refine((data) => Object.values(data).some((val) => val !== undefined), {
    message: "At least one field must be provided for update",
  });

export type UpdateApartmentInput = z.infer<typeof updateApartmentSchema>;
