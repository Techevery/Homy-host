import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';
import { startOfDay, isBefore } from 'date-fns';
import { logger } from './core/helpers/logger';

const prisma = new PrismaClient();

class AgentCreditCron {
  // Function to credit agents for completed bookings
  static async creditAgentsForCompletedBookings(): Promise<void> {
    try {
      const today = startOfDay(new Date()); // Get start of today

      // Find successful transactions where booking_end_date has passed and not yet credited
      const transactions = await prisma.transaction.findMany({
        where: {
          status: 'success', 
          booking_end_date: {
            lte: today, // Booking end date is today or earlier
          },
          credited: false, // Only select uncredited transactions
        },
        include: {
          agent: true, // Include agent to access accountBalance
        },
      });

      if (transactions.length === 0) {
        logger.info({ message: 'No transactions eligible for crediting' });
        return;
      }

      for (const transaction of transactions) {
        let creditAmount: number;

        // Calculate agent's fee based on agentPercentage or mockupPrice
        if (transaction.agentPercentage && transaction.agentPercentage > 0) {
          // Agent gets percentage of the total amount
          creditAmount = transaction.amount * (transaction.agentPercentage / 100);
        } else if (transaction.mockupPrice && transaction.mockupPrice > 0) {
          // Agent gets the mockupPrice (e.g., 10,000 for a 70,000 total where base is 60,000)
          creditAmount = transaction.mockupPrice;
        } else {
          // Fallback: no commission if neither is set (log and skip, or set default)
          logger.warn({
            message: 'No valid agentPercentage or mockupPrice found',
            transactionId: transaction.id,
          });
          continue; // Skip to next transaction
        }

        // Update agent's account balance
        await prisma.agent.update({
          where: { id: transaction.agent_id },
          data: {
            accountBalance: {
              increment: creditAmount, // Assumes accountBalance is a numeric field
            },
          },
        });

        // Mark transaction as credited
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            credited: true, // Mark as credited
          },
        });

     // Update the associated ApartmentLog to mark as completed and available
        const apartmentLog = await prisma.apartmentLog.updateMany({
          where: {
            transaction_id: transaction.id, // Match the log to this transaction
            apartment_id: transaction.apartment_id, // Ensure correct apartment
            status: 'booked', // Only update if currently booked
          },
          data: {
            status: 'completed',
            availability: true, // Make apartment available again
          },
        });  

        if (apartmentLog.count === 0) {
          logger.warn({
            message: 'No matching ApartmentLog found to update',
            transactionId: transaction.id,
            apartmentId: transaction.apartment_id,
          });
        } else {
          logger.info({
            message: 'ApartmentLog updated to completed and available',
            transactionId: transaction.id,
            apartmentId: transaction.apartment_id,
          });
        }

        logger.info({
          message: 'Agent credited successfully',
          transactionId: transaction.id,
          agentId: transaction.agent_id,
          creditAmount,
        });
      }

      logger.info({
        message: 'Agent crediting completed',
        creditedTransactions: transactions.length,
      });
    } catch (error) {
      logger.error({
        message: 'Error in agent crediting cron job',
        error: error instanceof Error ? error.message : error,
      });
      throw error; // Optionally rethrow or handle as needed
    } finally {    
      await prisma.$disconnect(); 
    }
  }

  // Schedule the cron job to run daily at midnight WAT (UTC+1)
  static schedule(): void {
    cron.schedule('0 0 * * *', async () => {
      logger.info({ message: 'Starting agent crediting cron job' });
      await this.creditAgentsForCompletedBookings();
    }, {
      timezone: 'Africa/Lagos', // Set to Nigeria timezone
    });
  }
}

export default AgentCreditCron;