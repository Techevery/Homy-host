/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from "../core/utils/prisma";
import Helper from "../core/helpers";
import { deleteImageFromSupabase, uploadImageToSupabase } from "../core/utils/supabase";
import { getAgentById } from "../core/repositories/admin";
import isEmail from "validator/lib/isEmail";
import { deleteImageFromBucket } from "../core/functions";
import { differenceInDays, isSameDay, parseISO } from "date-fns";
import { UpdateApartmentInput } from "../schema/apartment";
import { AgentStatus } from "@prisma/client";
import { sendRejectionMail } from "../email/notification";
import { logger } from "../core/helpers/logger";
// import { sendRejectionMail } from "../email/notification";
 
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
  updateData: UpdateApartmentInput,
  files?: Express.Multer.File[]
) {
  try {
    const existingApartment = await prisma.apartment.findUnique({
      where: { id: apartmentId },
    });

    if (!existingApartment) {
      throw new Error("Apartment not found");
    }

    let images = existingApartment.images;

    // --- NEW LOGIC ---
    if (files && files.length > 0) {
      // 1. Delete old images from Supabase (optional but recommended)
      for (const oldImg of existingApartment.images) {
        await deleteImageFromSupabase(oldImg); // comment this if not needed
      }

      // 2. Upload ONLY new images
      const newImageUrls = await Promise.all(
        files.map((file) => uploadImageToSupabase(file, "homey-images"))
      );

      // 3. Replace the images array
      images = newImageUrls;
    }

    const data: any = {
      images,
    };

    // --- Conditional update for other fields ---
    if (updateData.name !== undefined) data.name = updateData.name;
    if (updateData.address !== undefined) data.address = updateData.address;
    if (updateData.type !== undefined) data.type = updateData.type;
    if (updateData.amenities !== undefined) data.amenities = updateData.amenities;
    if (updateData.agentPercentage !== undefined)
      data.agentPercentage = updateData.agentPercentage;
    if (updateData.servicing !== undefined) data.servicing = updateData.servicing;
    if (updateData.bedroom !== undefined) data.bedroom = updateData.bedroom;
    if (updateData.price !== undefined) data.price = updateData.price;

    const updatedApartment = await prisma.apartment.update({
      where: { id: apartmentId },
      data,
    });

    return updatedApartment;
  } catch (error: any) {
    throw new Error(error.message);
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
      select: {
        id: true,
        name: true,
        address: true,
        type: true,
        servicing: true,
        amenities: true,
        bedroom: true,
        price: true,
        images: true,
        video_link: true,
        adminId: true,
        agentPercentage: true,
        createdAt: true,
        updatedAt: true,

        // Select only what you need from ApartmentLog
        ApartmentLog: {
          orderBy: { created_at: "desc" },
          take: 1,
          select: {
            availability: true,
            status: true,
            // Nested select for booking_period
            booking_period: {
              select: {
                start_date: true,
                end_date: true,
              },
            },
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

  // reject agent application 
async rejectAgent(agentId: string, reason: string) {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId }, 
    });
    if (!agent) {
      throw new Error(`No record found for agent!`);
    }
    if (agent.status !== AgentStatus.UNVERIFIED) {
      throw new Error(`Agent cannot be rejected: status must be UNVERIFIED`);
    }
// send a rejectin mail to the agent 
    await sendRejectionMail(agent.email, agent.name, reason);
    await prisma.agent.delete({
      where: { id: agentId },
    });
    return { message: `Agent rejected and removed successfully!` };
  } catch (error) {
    console.error('Error rejecting agent:', error);
    throw error;
  }
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
      agents.map(async (agent: any) => {
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

  async toggleAgentSuspension(agentId: string): Promise<any> {
  try {
     const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) {
    throw new Error("Agent not found");
  }

  const newStatus = !agent.suspended;
  
  await prisma.agent.update({
    where: { id: agentId },
    data: { suspended: newStatus },
  });
  
  return `Agent has been ${newStatus ? "suspended" : "unsuspended"}.`;
  } catch (error) {
    throw new Error("Failed to suspend agent");
  } 
}
 

async offlineBookings(apartmentId: string, startDate: string[], endDate: string[], name: string, email: string, adminId: string) {
  try {
    const agent = await prisma.admin.findUnique({ where: { id: adminId } });
    if (!agent) throw new Error(`No agent found for this apartment`);

    const adminListing = await prisma.apartment.findFirst({ where: { adminId } });  
    if (!adminListing) throw new Error(`No agent found for this listing`);

    const booking = await this.validateAndParseBookingPeriods(startDate, endDate);  

    // Take note of this in case no listing for the agent 
    const agentList = await prisma.agentListing.findFirst({ where: { apartment_id: apartmentId } });

    const hasConflict = await this.isApartmentBookedForPeriods(apartmentId, booking);
    if (hasConflict) {
      const conflictingPeriods = await this.getConflictingPeriods(apartmentId, booking);
      const conflictMessages = conflictingPeriods.map(period => 
        `${period.startDate.toISOString()} to ${period.endDate.toISOString()}`
      );
      throw new Error(`Apartment is already booked for the following periods: ${conflictMessages.join(', ')}`);
    }

    const totalDurationDays = booking.reduce((total, period) => total + period.durationDays, 0);

    const dailyPrice = 0;
    const isMarkedUp = 0;
    const agentPercentage = 0;
    const mockupPrice = 0;

    // Generate a 10 character reference
    const reference = Math.random().toString(36).substring(2, 12).toUpperCase();

    const transactionData = await prisma.transaction.create({
      data: {
        reference,
        amount: 0,
        email,
        status: "success",
        // Store overall date range for backward compatibility
        booking_start_date: booking[0].startDate,
        booking_end_date: booking[booking.length - 1].endDate,
        duration_days: totalDurationDays,
        agent: { connect: { id: agentList?.agent_id } },
        apartment: { connect: { id: apartmentId } },
        mockupPrice, 
        agentPercentage,
        metadata: {
          dailyPrice,
          isMarkedUp,
          originalAmount: dailyPrice * totalDurationDays,
          fullName: name,
          totalBookingPeriods: booking.length
          // Don't store periods array in metadata anymore
        }, 
      },
    });

    const createdBookingPeriods = [];
    for (const period of booking) {
      const bookingPeriod = await prisma.bookingPeriod.create({
        data: {
          transaction_id: transactionData.id,
          apartment_id: apartmentId,
          start_date: period.startDate,
          end_date: period.endDate,
          duration_days: period.durationDays,
        }
      });
      createdBookingPeriods.push(bookingPeriod);

      console.log(JSON.stringify(createdBookingPeriods, null, 2))
    
      // Also create apartment log for each period
      await prisma.apartmentLog.create({
        data: {
          apartment_id: apartmentId,
          transaction_id: transactionData.id,
          booking_period_id: bookingPeriod.id,
          availability: false,
          status: 'booked',
        }
      });
    }

    await prisma.apartment.update({
      where: { id: apartmentId },
      data: {
        isBooked: true
      }
    });

    return transactionData; // Optional: return the created transaction for confirmation
  } catch (error: any) {
    console.log(error);
    throw new Error(`${error.message}`);
  }
}

async updateOfflineBooking(
  transactionId: string,  // Renamed param for clarity (was bookingId, but it's a transaction ID)
  startDate: string[], 
  endDate: string[],
) {
  try {
    // Fetch existing transaction with relations (fixed: query transaction directly, include bookingPeriods for apartment ID)
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        apartment: true,
        bookingPeriods: {  // Include to get apartment ID and for validation
          include: {
            apartment: true,
          }
        },
      },
    });

    if (!transaction) {
      throw new Error("Booking not found");
    }

    const apartmentId = transaction.apartment.id;

    const agentList = await prisma.agentListing.findFirst({ where: { apartment_id: apartmentId } });
    if (!agentList) {
      throw new Error("No agent listing for this apartment");
    }
   
    const booking = await this.validateAndParseBookingPeriods(startDate, endDate);

    // Check conflicts, excluding current booking
    const hasConflict = await this.isApartmentBookedForPeriods(apartmentId, booking);
    if (hasConflict) {
      const conflictingPeriods = await this.getConflictingPeriods(apartmentId, booking);
      const conflictMessages = conflictingPeriods.map(period => 
        `${period.startDate.toISOString()} to ${period.endDate.toISOString()}`
      );
      throw new Error(`Apartment is already booked for the following periods: ${conflictMessages.join(', ')}`);
    }

    const totalDurationDays = booking.reduce((total, period) => total + period.durationDays, 0);

    const dailyPrice = 0;
    const isMarkedUp = 0;
    const agentPercentage = 0;
    const mockupPrice = 0;

    // Update transaction (keep reference, amount=0, status="success", agent/apartment connections)
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        // Store overall date range for backward compatibility
        booking_start_date: booking[0].startDate,
        booking_end_date: booking[booking.length - 1].endDate,
        duration_days: totalDurationDays,
        mockupPrice, 
        agentPercentage,
        metadata: {
          dailyPrice,
          isMarkedUp,
          originalAmount: dailyPrice * totalDurationDays,
          totalBookingPeriods: booking.length,
        }, 
      },
    });

    // Delete old booking periods and apartment logs (fixed: use transaction_id)
    await prisma.apartmentLog.deleteMany({
      where: { transaction_id: transactionId },
    });

    await prisma.bookingPeriod.deleteMany({
      where: { transaction_id: transactionId },
    });

    // Create new booking periods and apartment logs
    for (const period of booking) {
      const bookingPeriod = await prisma.bookingPeriod.create({
        data: {
          transaction_id: transactionId,
          apartment_id: apartmentId,
          start_date: period.startDate,
          end_date: period.endDate,
          duration_days: period.durationDays,
        },
      });

      // Create apartment log for each period
      await prisma.apartmentLog.create({
        data: {
          apartment_id: apartmentId,
          transaction_id: transactionId,
          booking_period_id: bookingPeriod.id,
          availability: false, 
          status: 'booked',
        },
      }); 
    }

    // Fetch and return the updated transaction (with relations for completeness)
    const updatedTransaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        apartment: true,
        agent: true,
        // Add more includes if needed, e.g., bookingPeriods: { include: { apartment_logs: true } }
      },
    });

    return updatedTransaction;
  } catch (error: any) {
    console.log(error);
    throw new Error(`${error.message}`);
  }
}

// private validateAndParseBookingPeriods(startDates: string[], endDates: string[]): BookingPeriod[] {
//   const bookingPeriods: BookingPeriod[] = [];

//   for (let i = 0; i < startDates.length; i++) {
//     const startDate = startDates[i];
//     const endDate = endDates[i];

//     if (!startDate || !endDate) {
//       throw new Error("All start dates and end dates are required");
//     }

//     const parsedStartDate = parseISO(startDate);
//     const parsedEndDate = parseISO(endDate);

//     if (parsedStartDate > parsedEndDate) {
//       throw new Error(`End date must be on or after start date for period ${i + 1}`);
//     }

//     let durationDays: number;
//     if (isSameDay(parsedStartDate, parsedEndDate)) {
//       durationDays = 1;
//     } else {
//       durationDays = differenceInDays(parsedEndDate, parsedStartDate);
//       if (durationDays < 1) {
//         throw new Error(`Booking duration must be at least 1 day for period ${i + 1}`);
//       }
//     }

//     // Check for overlapping periods within the same booking request
//     for (const existingPeriod of bookingPeriods) { 
//       if (
//         (parsedStartDate >= existingPeriod.startDate && parsedStartDate <= existingPeriod.endDate) ||
//         (parsedEndDate >= existingPeriod.startDate && parsedEndDate <= existingPeriod.endDate) ||
//         (parsedStartDate <= existingPeriod.startDate && parsedEndDate >= existingPeriod.endDate)
//       ) {
//         throw new Error(`Booking periods cannot overlap. Period ${i + 1} overlaps with another period`);
//       }
//     }

//     bookingPeriods.push({
//       startDate: parsedStartDate,
//       endDate: parsedEndDate,
//       durationDays,
//     });
//   }

//   // Sort periods by start date (fixed: was b.endDate)
//   return bookingPeriods.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
// }

private validateAndParseBookingPeriods(startDates: string[], endDates: string[]): BookingPeriod[] {
  const bookingPeriods: BookingPeriod[] = [];

  for (let i = 0; i < startDates.length; i++) {
    const startDateStr = startDates[i];
    const endDateStr = endDates[i];

    if (!startDateStr || !endDateStr) {
      throw new Error("All start dates and end dates are required");
    }

    // Parse as UTC midnight to preserve exact calendar date in storage
    const parsedStartDate = parseISO(startDateStr + 'T00:00:00Z');
    const parsedEndDate = parseISO(endDateStr + 'T00:00:00Z');

    if (parsedStartDate > parsedEndDate) {
      throw new Error(`End date must be on or after start date for period ${i + 1}`);
    }

    let durationDays: number;
    if (isSameDay(parsedStartDate, parsedEndDate)) {
      durationDays = 1;
    } else {
      durationDays = differenceInDays(parsedEndDate, parsedStartDate);
      if (durationDays < 1) {
        throw new Error(`Booking duration must be at least 1 day for period ${i + 1}`);
      }
    }

    // Check for overlapping periods within the same booking request
    for (const existingPeriod of bookingPeriods) { 
      if (
        (parsedStartDate >= existingPeriod.startDate && parsedStartDate <= existingPeriod.endDate) ||
        (parsedEndDate >= existingPeriod.startDate && parsedEndDate <= existingPeriod.endDate) ||
        (parsedStartDate <= existingPeriod.startDate && parsedEndDate >= existingPeriod.endDate)
      ) {
        throw new Error(`Booking periods cannot overlap. Period ${i + 1} overlaps with another period`);
      }
    }

    bookingPeriods.push({
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      durationDays,
    });
  }

  // Sort periods by start date
  return bookingPeriods.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
}


  private async isApartmentBookedForPeriods(apartmentId: string, bookingPeriods: BookingPeriod[]): Promise<boolean> {
    for (const period of bookingPeriods) {
      const isBooked = await this.isApartmentBooked(apartmentId, period.startDate, period.endDate);
      if (isBooked) {
        return true;
      }
    }
    return false;
  }

  private async getConflictingPeriods(apartmentId: string, bookingPeriods: BookingPeriod[]): Promise<BookingPeriod[]> {
    const conflictingPeriods: BookingPeriod[] = [];

    for (const period of bookingPeriods) {
      const isBooked = await this.isApartmentBooked(apartmentId, period.startDate, period.endDate);
      if (isBooked) {
        conflictingPeriods.push(period);
      }
    }

    return conflictingPeriods;
  }

   private async isApartmentBooked(apartmentId: string, startDate: Date, endDate: Date): Promise<boolean> {
    const existingBooking = await prisma.bookingPeriod.findFirst({
      where: {
        apartment_id: apartmentId, 
        isDeleted: false,
        transaction: {
          status: "success" // Only check successful transactions
        },
        OR: [ 
          {
            start_date: { lte: endDate },
            end_date: { gte: startDate },
          },
        ],
      },
    });
  
    return !!existingBooking;
  }

async getAgentProfileDetails(agentId: string, status?: "info" | "payout" | "properties") {
  try {
    // Fetch the agent profile (always, for totals and info)
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        phone_number: true,
        bank_name: true,
        account_number: true,
        gender: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        profile_picture: true,
        id_card: true,
        slug: true,
        personalUrl: true,
        accountBalance: true,
        nextOfKinAddress: true,
        nextOfKinEmail: true,
        nextOfKinName: true,
        nextOfKinOccupation: true,
        nextOfKinPhone: true,
        nextOfKinStatus: true,
        suspended: true,
        // Exclude password
      },
    });

    if (!agent) {
      throw new Error("Agent not found");
    }

    // Calculate totals (always returned)
    // Total Balance: from agent's accountBalance
    const totalBalance = agent.accountBalance || 0;

    // Total Pending: sum of pending payout amounts
    const totalPendingAgg = await prisma.payout.aggregate({
      _sum: { amount: true },
      where: { agentId, status: "pending" },
    });
    const totalPending = totalPendingAgg._sum?.amount || 0;

    // Total Earning: sum of successful payout amounts
    const totalEarningAgg = await prisma.payout.aggregate({
      _sum: { amount: true },
      where: { agentId, status: "success" },
    });
    const totalEarning = totalEarningAgg._sum?.amount || 0;

    // Total Active Properties: count of AgentListing for this agent (assuming all are active)
    const totalActiveProperties = await prisma.agentListing.count({
      where: { agent_id: agentId },
    });

    // Prepare data based on filter (or default to "info" if no status)
    const effectiveStatus = status || "info";
    let data = [];

    if (effectiveStatus === "info") {
      // Return agent profile details (exclude password)
      data = [agent];
    } else if (effectiveStatus === "payout") {
      // Fetch all payouts for the agent, with transaction and booking periods
      data = await prisma.payout.findMany({
        where: { agentId },
        include: {
          transaction: {
            include: {
              bookingPeriods: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (effectiveStatus === "properties") {
      // Fetch all active listings with apartment details
      data = await prisma.agentListing.findMany({
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
              video_link: true,
              agentPercentage: true,
              amenities: true,
              isBooked: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: { updated_at: "desc" },
      });
    }

    // If no data for the filter, still return empty array
    if (data.length === 0 && effectiveStatus !== "info") {
      // Optional: Log or handle, but return empty
    }

    return {
      totals: {
        totalBalance,
        totalPending,
        totalEarning,
        totalActiveProperties,
      },
      data, // Filtered data (or profile for "info")
    };

  } catch (error: any) {
    logger.error({ agentId, status, error: error.message }, "Error fetching agent profile details");
    throw new Error(error.message || "Failed to fetch agent profile details");
  }
}

}

export default new AdminService();

interface BookingPeriod {
  startDate: Date;
  endDate: Date;
  durationDays: number;
}