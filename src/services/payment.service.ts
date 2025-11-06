import { differenceInDays, parseISO } from "date-fns";
import Paystack from "./paystack";
import { PaymentChannels, Currency } from "./paystack";
import prisma from "../core/utils/prisma";
import { logger } from "../core/helpers/logger";

interface BookingPeriod {
  startDate: Date;
  endDate: Date;
  durationDays: number;
}

interface PaymentMetadata {
  agentId: string;
  apartmentId: string;
  bookingPeriods: Array<{
    startDate: string;
    endDate: string;
    durationDays: number;
  }>;
  nextofKinName: string;
  nextofKinNumber: string;
  fullName: string;
  phoneNumber: string;
  totalDurationDays: number;
  dailyPrice: number;
  isMarkedUp: boolean;
}

class PaymentService {
  /**
   * Main payment initiation function
   */
  async initiatePayment(
    email: string,
    channels: PaymentChannels[],
    currency: Currency,
    agentId: string,
    apartmentId: string,
    startDates: string[],
    endDates: string[],
    phoneNumber: string,
    nextofKinName: string,
    nextofKinNumber: string,
    fullName: string
  ) {
    try {
      // Validate input arrays
      if (startDates.length !== endDates.length) {
        throw new Error("Start dates and end dates arrays must have the same length");
      }

      if (startDates.length === 0) {
        throw new Error("At least one booking period is required");
      }

      // Validate and parse booking periods
      const bookingPeriods = this.validateAndParseBookingPeriods(startDates, endDates);

      // Get agent listing with pricing
      const agentListing = await prisma.agentListing.findUnique({
        where: {
          unique_Agent_apartment: {
            agent_id: agentId,
            apartment_id: apartmentId,
          },
        },
        include: {
          apartment: true,
        },
      });

      if (!agentListing) {
        throw new Error("Apartment is not listed by this agent");
      }

      // Check availability for all periods
      const hasConflict = await this.isApartmentBookedForPeriods(apartmentId, bookingPeriods);
      if (hasConflict) {
        const conflictingPeriods = await this.getConflictingPeriods(apartmentId, bookingPeriods);
        const conflictMessages = conflictingPeriods.map(period => 
          `${period.startDate.toISOString()} to ${period.endDate.toISOString()}`
        );
        throw new Error(`Apartment is already booked for the following periods: ${conflictMessages.join(', ')}`);
      }

      // Calculate pricing
      const dailyPrice = agentListing.markedup_price 
        ? agentListing.markedup_price + agentListing.base_price 
        : agentListing.base_price;
       
      const totalDurationDays = bookingPeriods.reduce((total, period) => total + period.durationDays, 0);
      const totalAmount = this.calculateTotalAmount(bookingPeriods, dailyPrice);

      // Validate payment options
      const validChannel = this.validateChannels(channels);
      const validCurrency = this.validateCurrency(currency);

      // Prepare metadata
      const metadata: PaymentMetadata = {
        agentId,
        apartmentId,
        bookingPeriods: bookingPeriods.map(period => ({
          startDate: period.startDate.toISOString(),
          endDate: period.endDate.toISOString(),
          durationDays: period.durationDays
        })),
        nextofKinName,
        nextofKinNumber,
        fullName,
        phoneNumber,
        totalDurationDays,
        dailyPrice,
        isMarkedUp: agentListing.markedup_price !== null,
      };

      // Initialize payment with Paystack
      const { authorizationUrl, reference } = await Paystack.initializePayment({
        email,
        amount: totalAmount,
        channels: validChannel,
        currency: validCurrency,
        metadata: metadata as any, // Type assertion for Paystack metadata
      });

      logger.info({
        message: "Payment initialized successfully",
        params: { authorizationUrl, reference, totalAmount, bookingPeriods: metadata.bookingPeriods },
      });

      // Save pending transaction
      const isMarkedUp = agentListing.markedup_price !== null;
      const agentPercentage = agentListing.agent_commission_percent ? agentListing.agent_commission_percent : 0;
      const mockupPrice = agentListing.markedup_price ? agentListing.markedup_price : 0;

      // After creating the transaction, create individual booking periods
const transactionData = await prisma.transaction.create({
  data: {
    reference,
    amount: totalAmount,
    email,
    status: "pending",
    // Store overall date range for backward compatibility
    booking_start_date: bookingPeriods[0].startDate,
    booking_end_date: bookingPeriods[bookingPeriods.length - 1].endDate,
    duration_days: totalDurationDays,
    agent: { connect: { id: agentId } },
    apartment: { connect: { id: apartmentId } },
    mockupPrice,
    agentPercentage,
    metadata: {
      dailyPrice,
      isMarkedUp,
      originalAmount: dailyPrice * totalDurationDays,
      nextofKinName,
      nextofKinNumber,
      fullName,
      totalBookingPeriods: bookingPeriods.length
      // Don't store periods array in metadata anymore
    },
  },
});

// Create individual booking period records
const createdBookingPeriods = [];
for (const period of bookingPeriods) {
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

let currentMetadata: Record<string, any> = {};

if (transactionData.metadata && typeof transactionData.metadata === 'object' && !Array.isArray(transactionData.metadata)) {
  currentMetadata = transactionData.metadata as Record<string, any>;
}

await prisma.transaction.update({
  where: { id: transactionData.id },
  data: {
    metadata: {
      ...currentMetadata,
      bookingPeriodIds: createdBookingPeriods.map(bp => bp.id)
    }
  }
});

      logger.info({
        message: "Pending transaction record created successfully",
        transactionId: transactionData.id,
        reference,
        bookingPeriodsCount: bookingPeriods.length,
      });

      return {
        paymentUrl: authorizationUrl,
        reference,
        totalAmount,
        totalDurationDays,
        dailyPrice,
        isMarkedUp: agentListing.markedup_price !== null,
        bookingPeriods: metadata.bookingPeriods,
        totalBookingPeriods: bookingPeriods.length
      };

    } catch (error) {
      console.log("error", error)
      logger.error({
        message: "Error initiating payment",
        error: error instanceof Error ? error.message : 'Unknown error',
        agentId,
        apartmentId,
        startDates,
        endDates
      });
      throw error;
    }
  }

  private validateAndParseBookingPeriods(startDates: string[], endDates: string[]): BookingPeriod[] {
    const bookingPeriods: BookingPeriod[] = [];

    for (let i = 0; i < startDates.length; i++) {
      const startDate = startDates[i];
      const endDate = endDates[i];

      if (!startDate || !endDate) {
        throw new Error("All start dates and end dates are required");
      }

      const parsedStartDate = parseISO(startDate);
      const parsedEndDate = parseISO(endDate);

      if (parsedStartDate >= parsedEndDate) {
        throw new Error(`End date must be after start date for period ${i + 1}`);
      }

      const durationDays = differenceInDays(parsedEndDate, parsedStartDate);
      if (durationDays <= 0) {
        throw new Error(`Booking duration must be at least 1 day for period ${i + 1}`);
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
        durationDays
      });
    }

    // Sort periods by start date
    return bookingPeriods.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }

  /**
   * Check if apartment is booked for any of the periods
   */
  private async isApartmentBookedForPeriods(apartmentId: string, bookingPeriods: BookingPeriod[]): Promise<boolean> {
    for (const period of bookingPeriods) {
      const isBooked = await this.isApartmentBooked(apartmentId, period.startDate, period.endDate);
      if (isBooked) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get conflicting periods for detailed error message
   */
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

  /**
   * Calculate total amount for all booking periods
   */
  private calculateTotalAmount(bookingPeriods: BookingPeriod[], dailyPrice: number): number {
    const totalDurationDays = bookingPeriods.reduce((total, period) => total + period.durationDays, 0);
    return dailyPrice * totalDurationDays;
  }


  /**
   * Helper method to check if apartment is booked (existing method - keep as is)
   */

  // private async isApartmentBooked(apartmentId: string, startDate: Date, endDate: Date): Promise<boolean> {
  //   const existingBooking = await prisma.transaction.findFirst({
  //     where: {
  //       apartment_id: apartmentId,
  //       status: "booked",
  //       OR: [
  //         {
  //           booking_start_date: { lte: endDate },
  //           booking_end_date: { gte: startDate },
  //         },
  //       ],
  //     },
  //   });

  //   return !!existingBooking;
  // }

  private async isApartmentBooked(apartmentId: string, startDate: Date, endDate: Date): Promise<boolean> {
  const existingBooking = await prisma.bookingPeriod.findFirst({
    where: {
      apartment_id: apartmentId, 
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

  async verifyPayment(reference: string) {
  try {
    logger.info({ reference }, "Verifying payment with reference");

    const verification = await Paystack.verifyPayment(reference);

    logger.info({ verification }, "Paystack verification response");

    // Check for existing pending transaction early
    const existingTransaction = await prisma.transaction.findUnique({
      where: { reference: verification.data.reference },
    });

    if (!existingTransaction) {
      logger.error({ reference }, "No pending transaction found");
      throw new Error("No pending transaction found");
    }

    // if (verification.data.status !== "success") {
    //   // Update to failed instead of logging a new one
    //   await prisma.transaction.update({
    //     where: { reference: verification.data.reference }, 
    //     data: {
    //       status: "failed",
    //       // Optionally add channel or other details if available: channel: verification.data.channel,
    //     },
    //   });

    //   logger.error(
    //     { status: verification.data.status },
    //     "Payment verification failed"
    //   );

    //   throw new Error("Payment verification failed");
    // }

    const metadata = verification.data.metadata || {};

    // Extract metadata
    const {
      agentId,
      apartmentId,
      startDate,
      endDate,
      
      durationDays,
      dailyPrice,
      isMarkedUp,
      feeDetails
    } = metadata;

    logger.info({
      message: "Extracted metadata",
      metadata,
    });

    // Validate required fields
    if (
      !agentId ||
      !apartmentId ||
      !startDate ||
      !endDate ||
      !durationDays ||
      !dailyPrice ||
      isMarkedUp === undefined
    ) {
      logger.error({
        message: "Incomplete payment metadata",
        metadata: verification.data.metadata,
      });

      // Update to failed
      await prisma.transaction.update({
        where: { reference: verification.data.reference },
        data: { status: "failed" },
      });

      throw new Error("Incomplete payment metadata");
    }

    // Verify agent and apartment exist
    const [agentExists, apartmentExists] = await Promise.all([
      prisma.agent.findUnique({ where: { id: agentId } }),
      prisma.apartment.findUnique({ where: { id: apartmentId } }),
    ]);   

    if (!agentExists || !apartmentExists) {
      logger.error({
        message: "Agent or Apartment not found",
        agentExists,
        apartmentExists,
      });

      // Update to failed
      await prisma.transaction.update({
        where: { reference: verification.data.reference },
        data: { status: "failed" },
      });

      throw new Error("Agent or Apartment not found");
    }

    // Update the existing transaction with verification details
    const transactionData = await prisma.transaction.update({
      where: { reference: verification.data.reference },
      data: {
        status: verification.data.status,
        channel: verification.data.channel,
        charge: verification.data.feeDetails?.fee,
        date_paid: new Date(verification.data.transaction_date),
        payment_month: new Date(verification.data.transaction_date).getMonth() + 1,
        payment_year: new Date(verification.data.transaction_date).getFullYear(),
        // Optionally verify amount/email match existingTransaction if needed
      },
    });

    logger.info({
      message: "Transaction record updated successfully",
      transactionId: transactionData.id,
    });

    if (!metadata.apartmentId || !metadata.startDate || !metadata.endDate) {
      // Update to failed (though unlikely to reach here)
      await prisma.transaction.update({
        where: { reference: verification.data.reference },
        data: { status: "failed" },
      });
      throw new Error("Missing required metadata for apartment log creation");
    }

    // Create apartment log
    const apartmentLog = await prisma.apartmentLog.create({
      data: {
        apartment: { connect: { id: metadata.apartmentId } },
        transaction: { connect: { id: transactionData.id } },
        availability: false,
        status: "booked",
        // booking_start_date: new Date(metadata.startDate),
        // booking_end_date: new Date(metadata.endDate),
        // duration_days: Number(metadata.durationDays),
      },
    });

    logger.info({
      message: "Payment verified successfully",
      params: { transactionData, apartmentLog },
    });

    return {
      transaction: transactionData,
      booking: apartmentLog,
      pricingDetails: {
        dailyPrice,
        durationDays,
        isMarkedUp,
      },
    };
  } catch (error) {
    console.log(error, "errors")
    logger.error({
      message: "Error during payment verification",
      error: error instanceof Error ? error.message : error,
      reference,
    });

    // Attempt to update to failed if possible (fallback)
    try {
      await prisma.transaction.update({
        where: { reference },
        data: { status: "failed" },
      });
    } catch (updateError) {
      logger.error({
        message: "Failed to update transaction to failed",
        error: updateError instanceof Error ? updateError.message : updateError,
      });
    }

    throw error;
  }
}

  private validateChannels(channels: PaymentChannels[]): PaymentChannels[] {
    const validChannels: PaymentChannels[] = [
      "card",
      "bank",
      "ussd",
      "qr",
      "mobile_money",
      "bank_transfer",
      "eft",
    ];

    return channels.filter((channel) =>
      validChannels.includes(channel as PaymentChannels)
    ) as PaymentChannels[];
  }

  private validateCurrency(currency: string): Currency {
    const validCurrencies: Currency[] = ["NGN", "USD", "GHS", "ZAR", "KES"];

    if (validCurrencies.includes(currency as Currency)) {
      return currency as Currency;
    }

    return "NGN";
  }

  // private async isApartmentBooked(
  //   apartmentId: string,
  //   startDate: Date,
  //   endDate: Date
  // ): Promise<boolean> {
  //   const conflictingBookings = await prisma.apartmentLog.count({
  //     where: {
  //       apartment_id: apartmentId,
  //       status: "booked",
  //       OR: [
  //         {
  //           booking_start_date: { lte: endDate },
  //           booking_end_date: { gte: startDate },
  //         },
  //       ],
  //     },
  //   });

  //   return conflictingBookings > 0;
  // }

  /**
   * Log a failed transaction to the FailedTransaction table
   */
  private async logFailedTransaction(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    paystackData: Record<string, any>,
    failureReason: string,
    errorCode?: string
  ) {
    try {
      const metadata = paystackData.metadata || {};
      const { agentId, apartmentId } = metadata;

      // Only log if we have the required data
      if (!agentId || !apartmentId) {
        logger.warn({
          message:
            "Cannot log failed transaction - missing agentId or apartmentId",
          metadata,
        });
        return;
      }

      const transactionDate = paystackData.transaction_date
        ? new Date(paystackData.transaction_date)
        : new Date();

      const failedTransaction = await prisma.failedTransaction.create({
        data: {
          email:
            paystackData.customer?.email ||
            metadata.email ||
            "unknown@email.com",
          phone_number:
            paystackData.customer?.phone || metadata.phone || "unknown",
          amount: paystackData.amount?.toString() || "0",
          channel: paystackData.channel || "unknown",
          charge: paystackData.fees?.toString() || "0",
          metadata: JSON.stringify(paystackData.metadata || {}),
          reference: paystackData.reference,
          failure_reason: failureReason,
          error_code: errorCode || paystackData.gateway_response || "unknown",
          payment_month: transactionDate.getMonth() + 1,
          payment_year: transactionDate.getFullYear(),
          apartment: { connect: { id: apartmentId } },
          agent: { connect: { id: agentId } },
        },
      });

      logger.info({
        message: "Failed transaction logged successfully",
        failedTransactionId: failedTransaction.id,
        reference: paystackData.reference,
        failureReason,
      });

      return failedTransaction;
    } catch (error) {
      logger.error({
        message: "Error logging failed transaction",
        error: error instanceof Error ? error.message : error,
        paystackData: {
          reference: paystackData.reference,
          status: paystackData.status,
        },
      });
    }
  }

  /**
   * Get all failed transactions with optional filtering
   */
  async getFailedTransactions(filters?: {
    agentId?: string;
    apartmentId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};

    if (filters?.agentId) {
      where.agent_id = filters.agentId;
    }

    if (filters?.apartmentId) {
      where.apartment_id = filters.apartmentId;
    }

    if (filters?.startDate || filters?.endDate) {
      where.attempted_at = {};
      if (filters.startDate) {
        where.attempted_at.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.attempted_at.lte = filters.endDate;
      }
    }

    const failedTransactions = await prisma.failedTransaction.findMany({
      where,
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        apartment: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
      orderBy: {
        attempted_at: "desc",
      },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
    });

    const total = await prisma.failedTransaction.count({ where });

    return {  
      failedTransactions,
      total,
      pagination: {
        limit: filters?.limit || 50,
        offset: filters?.offset || 0,
        total,
      },
    };
  }

  /**
   * Retry a failed transaction by re-initiating payment
   */
  async retryFailedTransaction(failedTransactionId: string) {
    const failedTransaction = await prisma.failedTransaction.findUnique({
      where: { id: failedTransactionId },
      include: {
        agent: true,
        apartment: true,
      },
    });

    if (!failedTransaction) {
      throw new Error("Failed transaction not found");
    }

    // Parse metadata to get booking details
    const metadata = JSON.parse(failedTransaction.metadata);
    const { startDate, endDate, phoneNumber, nextofKinName, nextOfKinNumber, fullName } = metadata;

    if (!startDate || !endDate) {
      throw new Error("Missing booking dates in failed transaction metadata");
    }
    
    // Re-initiate payment
    const paymentInitiation = await this.initiatePayment(
      failedTransaction.email,
      [failedTransaction.channel as PaymentChannels],
      "NGN" as Currency,
      failedTransaction.agent_id,
      failedTransaction.apartment_id,
      startDate,
      endDate,
     phoneNumber,
     nextofKinName,
     nextOfKinNumber,
     fullName
    );

    logger.info({
      message: "Retrying failed transaction",
      originalFailedTransactionId: failedTransactionId,
      newReference: paymentInitiation.reference,
    });

    return paymentInitiation;
  }
}

export default new PaymentService();

// TODO: store failed transactions as well, consider network issues

// TODO: add a cron job to check for failed transactions and retry them

// TODO: implement block apartment for the super agent for specified days, modify apartment log checking: the booking should reflect in the apartment listing (calender)

// TODO: add booking checking for users to confirm their recipt;  using email, phonenumber, or transaction reference; return receipt; durati
