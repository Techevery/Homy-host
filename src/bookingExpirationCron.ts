import { isBefore } from 'date-fns';
import { logger } from './core/helpers/logger';
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class BookingExpirationCron {
static async checkAndExpireBookings(): Promise<void> {
  try {
    const now = new Date();

    // Find non-expired, non-deleted booking periods
    const bookings = await prisma.bookingPeriod.findMany({
      where: {
        expired: false,
        isDeleted: false,
      },
    });

    if (bookings.length === 0) {
      logger.info({ message: 'No bookings eligible for expiration check' });
      return;
    }

    const expiredBookingIds: string[] = [];

    for (const booking of bookings) {
      const effectiveEndDate: Date = booking.end_date;

      // Check if effective end date is in the past
      if (isBefore(effectiveEndDate, now)) {
        // Update booking period to expired
        await prisma.bookingPeriod.update({
          where: { id: booking.id },
          data: {
            expired: true,
          },
        });

        // Unbook the apartment (assumes single active booking per apartment)
        await prisma.apartment.updateMany({
          where: { id: booking.apartment_id },
          data: {
            isBooked: false,
          },
        });

        expiredBookingIds.push(booking.id);

        logger.info({
          message: 'Booking period expired', 
          bookingId: booking.id,
          effectiveEndDate: effectiveEndDate.toISOString(),
        });
      }
    }

    if (expiredBookingIds.length > 0) {
      logger.info({
        message: 'Booking expiration check completed',
        expiredBookings: expiredBookingIds.length,
      });
    } else {
      logger.info({ message: 'No bookings expired in this check' });
    }
  } catch (error) {
    logger.error({
      message: 'Error in booking expiration cron job',
      error: error instanceof Error ? error.message : error,
    });
    throw error; // Optionally rethrow or handle as needed
  } finally {
    await prisma.$disconnect();
  }
}

  // Schedule the cron job to run every 5 minutes
  static schedule(): void {
    cron.schedule('*/5 * * * *', async () => {
      logger.info({ message: 'Starting booking expiration cron job' });
      await this.checkAndExpireBookings();
    }, {
      timezone: 'Africa/Lagos', // Set to Nigeria timezone
    });
  }
}

export default BookingExpirationCron;