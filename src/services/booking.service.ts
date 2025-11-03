import { logger } from "../core/helpers/logger";
import prisma from "../core/utils/prisma";
import { ApartmentLog } from "@prisma/client";  

class BookingService{
    async getAllBookingsForAdmin(): Promise<any[]> {
        try {
            const bookings = await prisma.apartmentLog.findMany({
                orderBy: { created_at: 'desc' },
                select: {
                    id: true,
                    apartment_id: true, 
                    availability: true,
                    status: true,
                    created_at: true,
                    transaction_id: true,
                    transaction:{
                        select: {
                           reference: true 
                        }
                    },
                    booking_period: {
                        select: {
                            start_date: true,
                            end_date: true,
                            duration_days: true
                        }
                    },
                    apartment: {
                        select: {
                            name: true,
                            address: true,
                            type: true,
                            servicing: true
                        }
                    }
                }
            }); 
            return bookings;
        } catch (error) {
            logger.error("Error fetching bookings:", error);
            throw new Error("Could not fetch bookings");
        }
    }

    async bookingById(id: string){
        try {
            const booking = await prisma.apartmentLog.findFirst({where: {id}})
            if(!booking) return "No booking found!"
            return booking
        } catch (error) {
            throw new Error ("cooould noot fetch booking")
        }
    }

    // list of data booked for an aprtment 

    async getBookingDates(apartmentId: string): Promise<any[]> {
        try {
            const dates = await prisma.apartmentLog.findMany({
                where: {
                    status: 'booked',
                    availability: false,
                    apartment_id: apartmentId
                },
                include: {
                    booking_period: {
                        select: {
                            start_date: true,
                            end_date: true,
                        }
                    }
                }
            });
            return dates;
        } catch (error) {
            logger.error("Error fetching booking dates:", error);
            throw new Error("Could not fetch booking dates"); 
        }
    }
    async manageBooking(email: string, phoneNumber: string) {
        try {
            // Implement your booking management logic here
            // This is a placeholder implementation
            logger.info(`Managing booking for email: ${email}, phoneNumber: ${phoneNumber}`);
            const whereClause: any = {
      AND: [],
    };

    if (email) {
      whereClause.AND.push({
        transaction: { email: email.toLowerCase() },
      });
    }

    if (phoneNumber) {
      whereClause.AND.push({
        transaction: { phone_number: phoneNumber },
      });
    }

    const bookings = await prisma.apartmentLog.findMany({
      where: whereClause,
      include: {
        apartment: {
          select: {
            id: true, 
            name: true,
            address: true,
            price: true,
          },
        },
        transaction: {
          select: {
            id: true,
            email: true,
            phone_number: true,
            status: true,
            amount: true,
            booking_start_date: true,
            booking_end_date: true,
            duration_days: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return bookings;
        } catch (error) {
            logger.error("Error managing booking:", error);
            throw new Error("Could not manage booking");
        }
    }

    // Get all bookings for an apartment in a date range
// const bookings = await prisma.bookingPeriod.findMany({
//   where: {
//     apartment_id: apartmentId,
//     start_date: { gte: startDate },
//     end_date: { lte: endDate },
//     transaction: { status: "success" }
//   },
//   include: {
//     transaction: true
//   }
// });

// // Get availability for specific dates
// const isAvailable = await prisma.bookingPeriod.findFirst({
//   where: {
//     apartment_id: apartmentId,
//     transaction: { status: "success" },
//     OR: [
//       { start_date: { lte: checkInDate }, end_date: { gte: checkInDate } },
//       { start_date: { lte: checkOutDate }, end_date: { gte: checkOutDate } },
//       { 
//         start_date: { gte: checkInDate }, 
//         end_date: { lte: checkOutDate } 
//       }
//     ]
//   }
// }) === null;
}

export default new BookingService();