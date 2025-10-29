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
}  

export default new BookingService();