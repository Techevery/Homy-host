import { logger } from "../core/helpers/logger";
import prisma from "../core/utils/prisma";
import { ApartmentLog } from "@prisma/client";  

class BookingService{
    async getAllBookingsForAdmin(): Promise<ApartmentLog[]> {
        try {
            const bookings = await prisma.apartmentLog.findMany({
                orderBy: { created_at: 'desc' },
                select: {
                    id: true,
                    apartment_id: true, 
                    availability: true,
                    booking_end_date: true,
                    booking_start_date: true,
                    status: true,
                    created_at: true,
                    duration_days: true,
                    transaction_id: true,
                    transaction:{
                        select: {
                           reference: true 
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

    async getBookingDates(apartmentId: string): Promise<{booking_start_date: Date | null, booking_end_date: Date | null}[]> {
        try {
            const dates = await prisma.apartmentLog.findMany({
                where: {
                    status: 'booked',
                    availability: false,
                    apartment_id: apartmentId
                },
                select: {
                    booking_start_date: true,
                    booking_end_date: true
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
}

export default new BookingService();