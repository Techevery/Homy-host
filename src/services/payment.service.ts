import { differenceInDays, isSameDay, parseISO } from "date-fns";
import Paystack from "./paystack";
import { PaymentChannels, Currency } from "./paystack";
import prisma from "../core/utils/prisma";
import { logger } from "../core/helpers/logger";
import { Request } from "express";
import crypto from 'crypto'; // For signature verification

interface PaystackWebhookEvent {
  event: string;
  data: {
    reference: string;
    status: string;
    channel: string;
    amount: number;
    transaction_date: string; // ISO string
    fee?: number; // From fees
  };
}

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
    fullName: string,
    req: Request
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
          agent: true
        },
      });

      if (!agentListing) {
        throw new Error("Apartment is not listed by this agent");
      }

      const agentUrl = agentListing.agent.slug

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
      const { authorizationUrl, reference, status } = await Paystack.initializePayment(
        {
        email,
        amount: totalAmount,
        channels: validChannel,
        currency: validCurrency,
        metadata: metadata as any, // Type assertion for Paystack metadata
      },
      agentUrl,
      req
    );

      logger.info({
        message: "Payment initialized successfully",
        params: { authorizationUrl, totalAmount, },
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
    booking_start_date: bookingPeriods[0].startDate,
    booking_end_date: bookingPeriods[bookingPeriods.length - 1].endDate,
    duration_days: totalDurationDays,
    agent: { connect: { id: agentId } },
    apartment: { connect: { id: apartmentId } },
    mockupPrice,
    phone_number: phoneNumber,
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

let currentMetadata: Record<string, any> = {};

await prisma.transaction.update({
  where: { id: transactionData.id },
  data: {
    metadata: {
      ...currentMetadata,
      bookingPeriods: bookingPeriods.map(p => ({
        startDate: p.startDate.toISOString(),
        endDate: p.endDate.toISOString(),
        durationDays: p.durationDays
      }))
    }
  }
});


      logger.info({
        message: "Pending transaction record created successfully",
        transactionId: transactionData.id,
      });

      return {
        paymentUrl: authorizationUrl,
        reference,
        status,
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
      });
      throw error;
    }
  }

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
 private async isApartmentBooked(apartmentId: string, startDate: Date, endDate: Date): Promise<boolean> {
  const existingBooking = await prisma.bookingPeriod.findFirst({
    where: {
      apartment_id: apartmentId,
      isDeleted: false,
      expired: false,
      start_date: { lte: endDate },
      end_date: { gte: startDate },
      transaction: {
        status: "success",
      },
    },
  });

  return !!existingBooking;
}

// New webhook handler (Express-style; adapt to your framework)
async handlePaystackWebhook(req: any, res: any): Promise<void> {
  try {
    const event: PaystackWebhookEvent = req.body;
    const signature = req.headers['x-paystack-signature'];

    // 1. Verify the signature for security
    const secretKey = process.env.PAYSTACK_SECRET_KEY; // Ensure this is set
    if (!secretKey) {
      logger.error('Paystack secret key not configured');
      res.status(500).send('Server error');
      return; 
    }

    const hash = crypto
      .createHmac('sha512', secretKey)
      .update(JSON.stringify(event))
      .digest('hex'); 
 
    if (hash !== signature) {
      logger.error('Invalid Paystack signature');
      res.status(400).send('Invalid signature');
      return;
    }

    logger.info({ event: event.event }, 'Received Paystack webhook');

    const data = event.data;

    // 2. Handle only relevant events (e.g., charge.success)
    if (event.event === 'charge.success') {
      logger.info({ event: event.event }, 'Processing successful payment event');

      // Fetch the transaction (no need for bookingPeriods include yet, as they don't exist)
      const transaction = await prisma.transaction.findUnique({
        where: { reference: data.reference },
      });

      if (!transaction) {
        logger.error({ reference: data.reference }, 'Transaction not found');
        res.status(404).send('Transaction not found'); 
        return;
      }

      // Optional: Re-check availability before creating bookings (to handle any race conditions)
      // Extract booking periods from metadata
      const metadata = transaction.metadata as any;
      const metadataBookingPeriods = metadata?.bookingPeriods || [];
      if (metadataBookingPeriods.length === 0) {
        logger.error({ transactionId: transaction.id }, 'No booking periods in metadata');
        res.status(500).send('Invalid transaction metadata');
        return;
      }

      const bookingPeriodsToCreate = metadataBookingPeriods.map((p: any) => ({
        startDate: new Date(p.startDate),
        endDate: new Date(p.endDate),
        durationDays: p.durationDays,
      }));

      // Re-validate availability (using your existing method)
      const hasConflict = await this.isApartmentBookedForPeriods(transaction.apartment_id, bookingPeriodsToCreate);
      if (hasConflict) {
        logger.error({ transactionId: transaction.id }, 'Availability conflict detected on payment confirmation');
        res.status(500).send('Availability changed; booking failed');
        return;
      }

      // 3. Update transaction status and set payment date
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'success',
          date_paid: new Date(),
        },
      });

      // 4. Create BookingPeriod records from metadata
      const createdBookingPeriods = [];
      for (const periodData of metadataBookingPeriods) {
        const bookingPeriod = await prisma.bookingPeriod.create({
          data: {
            transaction_id: transaction.id,
            apartment_id: transaction.apartment_id,
            start_date: new Date(periodData.startDate),
            end_date: new Date(periodData.endDate),
            duration_days: periodData.durationDays,
            status: 'booked',
          },
        });
        createdBookingPeriods.push(bookingPeriod);
        logger.info({ bookingPeriodId: bookingPeriod.id }, 'BookingPeriod created');
      }
 
      if (createdBookingPeriods.length === 0) {
        logger.error({ transactionId: transaction.id }, 'Failed to create booking periods');
        res.status(500).send('Failed to create bookings');
        return;
      }

      // 5. Create ApartmentLog entries for each booking period
      const createdLogs: any[] = [];
      for (const bookingPeriod of createdBookingPeriods) {
        const apartmentLog = await prisma.apartmentLog.create({
          data: {
            apartment_id: transaction.apartment_id, // Or bookingPeriod.apartment_id if different
            transaction_id: transaction.id,
            booking_period_id: bookingPeriod.id,
            availability: false,
            status: 'booked',
            agentId: transaction.agent_id,
          },
        });
        createdLogs.push(apartmentLog);
        logger.info({ logId: apartmentLog.id }, 'ApartmentLog created');
      }

      if (createdLogs.length === 0) {
        logger.warn({ transactionId: transaction.id }, 'No ApartmentLogs created');
      }

      logger.info({ transactionId: transaction.id }, 'Transaction processed successfully: bookings and logs created');

      // 6. Acknowledge success
      res.status(200).send('OK');
      return;
    } else {
      // Log other events but acknowledge to avoid retries
      logger.info({ event: event.event }, 'Unhandled Paystack event (acknowledged)');
      res.status(200).send('OK');
      return;
    }
  } catch (error) { 
    logger.error({
      message: 'Error in Paystack webhook handler',
      error: error instanceof Error ? error.message : error,
    });
    res.status(500).send('Webhook processing failed'); // Don't retry on server error
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
  // async retryFailedTransaction(failedTransactionId: string) {
  //   const failedTransaction = await prisma.failedTransaction.findUnique({
  //     where: { id: failedTransactionId },
  //     include: {
  //       agent: true,
  //       apartment: true,
  //     },
  //   });

  //   if (!failedTransaction) {
  //     throw new Error("Failed transaction not found");
  //   }

  //   // Parse metadata to get booking details
  //   const metadata = JSON.parse(failedTransaction.metadata);
  //   const { startDate, endDate, phoneNumber, nextofKinName, nextOfKinNumber, fullName, personalUrl } = metadata;

  //   if (!startDate || !endDate) {
  //     throw new Error("Missing booking dates in failed transaction metadata");
  //   }
    
  //   // Re-initiate payment
  //   const paymentInitiation = await this.initiatePayment(
  //     failedTransaction.email,
  //     [failedTransaction.channel as PaymentChannels],
  //     "NGN" as Currency,
  //     failedTransaction.agent_id,
  //     failedTransaction.apartment_id,
  //     startDate,
  //     endDate,
  //    phoneNumber,
  //    nextofKinName,
  //    nextOfKinNumber,
  //    fullName,
  //   );

  //   logger.info({
  //     message: "Retrying failed transaction",
  //     originalFailedTransactionId: failedTransactionId,
  //     newReference: paymentInitiation.reference,
  //   });

  //   return paymentInitiation;
  // }
}

export default new PaymentService();

// TODO: store failed transactions as well, consider network issues

// TODO: add a cron job to check for failed transactions and retry them

// TODO: implement block apartment for the super agent for specified days, modify apartment log checking: the booking should reflect in the apartment listing (calender)

// TODO: add booking checking for users to confirm their recipt;  using email, phonenumber, or transaction reference; return receipt; durati
