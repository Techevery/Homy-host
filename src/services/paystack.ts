import axios from "axios";
import "dotenv/config";
// import Helper from "../core/helpers";
import { logger } from "../core/helpers/logger";

export type PaymentChannels =
  | "bank"
  | "card"
  | "qr"
  | "ussd"
  | "mobile_money"
  | "eft"
  | "bank_transfer"
  | "payattitude";

export type Currency = "NGN" | "GHS" | "USD" | "ZAR" | "KES" | "XOF";

interface PaystackMetadata {
  agentId: string;
  apartmentId: string;
  startDate?: string; // Make optional if needed
  endDate?: string;
  durationDays?: number;
  dailyPrice: number;
  isMarkedUp: boolean;
  originalAmount?: number;
}

interface paystackBody {
  amount: number;
  email: string;
  channels: PaymentChannels[];
  currency: Currency;
  metadata?: PaystackMetadata;
}

export interface PaystackPaymentInitiation {
  email: string;
  amount: number;
  channel?: PaymentChannels[];
  currency?: Currency;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any>;
}

class Paystack {
  request: unknown;

  static calculatePaystackCharge(amountInNaira: number): number {
    // Paystack Nigeria pricing (as of 2023):
    // - 1.5% of transaction amount
    // - Additional ₦100 charge
    // - Maximum charge of ₦2000

    const percentageCharge = amountInNaira * 0.015; // 1.5%
    let totalCharge = percentageCharge + 100; // Base charge + ₦100

    // Apply ₦2000 cap
    totalCharge = Math.min(totalCharge, 2000);

    return totalCharge;
  }

  static getFeeBreakdown(amount: number) {
    const fee = this.calculatePaystackCharge(amount);

    return {
      amount,
      fee,
      total: amount + fee,
      breakdown: `1.5% + ₦100 (capped at ₦2000)`,
    };
  }

  async initializePayment(payload: paystackBody) {
    const feeDetails = Paystack.getFeeBreakdown(payload.amount);

    const charge = Paystack.calculatePaystackCharge(payload.amount);

    const totalAmountInNaira = payload.amount + charge;

    const amountInKobo = Math.round(totalAmountInNaira * 100);

    const paymentData = {
      amount: amountInKobo,
      email: payload.email,
      charge: Math.round(charge * 100), // charge in kobo
      // reference: Helper.generatePaystackRef(),
      channel: payload.channels,
      currency: payload.currency,
      metadata: {
        email: payload.email,
        feeDetails,
        ...(payload.metadata || {}),
      },
    };

    try {
      const response = await axios.post(
        `${process.env.PAYSTACK_URL}/transaction/initialize`,
        paymentData,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "content-type": "application/json",
            "cache-control": "no-cache",
          },
        }
      );
      // console.log("Response.data:", response.data);
      return {
        authorizationUrl: response.data.data.authorization_url,
        reference: response.data.data.reference,
      };
    } catch (error) {
      console.error("Error initializing Payment:", error);
      throw new Error("Payment initialization failed");
    }
  }

  async verifyPayment(ref: string) {
    try {
      const transaction = await axios.get(
        `${process.env.PAYSTACK_URL}/transaction/verify/${encodeURIComponent(
          ref
        )}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "content-type": "application/json",
            "cache-control": "no-cache",
          },
        }
      );
      return transaction.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(
          {
            status: error.response?.status,
            data: error.response?.data,
          },
          "Paystack verification error"
        );
      } else {
        logger.error({ error }, "Unknown error verifying payment");
      }
      throw new Error("Payment verification failed with paystack");
    }
  }
}

export default new Paystack();
