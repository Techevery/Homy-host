import { logger } from "../core/helpers/logger";
import prisma from "../core/utils/prisma";
import { differenceInDays } from 'date-fns';

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
                           reference: true,
                           email: true,
                           amount: true,
                           phone_number: true,
                           metadata: true,
                           agent: { 
                            select: {name: true}
                           }
                        }
                    },
                    booking_period: { 
                        select: {
                            start_date: true,
                            end_date: true,
                            duration_days: true,
                            id: true
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
            logger.error("Error fetching bookings:");
            throw new Error("Could not fetch bookings");
        }
    }

async bookingRequest() {
  try {
    const bookings = await prisma.bookingPeriod.findMany({
      where: { isDeleted: false, expired: false },
      include: {
        apartment: {
          select: {
            id: true,
            name: true,
            address: true,
            // agents: {
            //   select: {
            //     id: true,
            //     name: true
            //   }
            // }
          }
        },
        transaction: {
          select: {
            id: true,
            email: true,
            phone_number: true,
            amount: true,
            booking_start_date: true,
            booking_end_date: true,
            duration_days: true,
            status: true,
            metadata: true,
            agent: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    const currentDate = new Date();

    bookings.forEach(bk => {
      if (bk.start_date > currentDate) {
        (bk as any).status = "upcoming";
      } else if (bk.end_date < currentDate) {
        (bk as any).status = "completed";
      } else {
        (bk as any).status = "ongoing";
      }
    });

    return bookings;

  } catch (error) {
    console.log(error);
    throw new Error("Could not fetch booking requests");
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
            const dates = await prisma.bookingPeriod.findMany({
                where: {
                    apartment_id: apartmentId,
                    isDeleted: false,
                    expired: false
                },
                        select: {
                            start_date: true,
                            end_date: true,
                        }
            });
            return dates;
        } catch (error) {
            logger.error("Error fetching booking dates:");
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
            logger.error("Error managing booking:");
            throw new Error("Could not manage booking");
        }
    }

    // edit existing booking
async editBookingDates(bookingId: string, newStartDate: Date, newEndDate: Date) {
  try {
    const existingBooking = await prisma.bookingPeriod.findUnique({
      where: { id: bookingId },
    });

    if (!existingBooking) {
      throw new Error("Booking not found");
    }

    // Calculate the duration in days for the new booking period (inclusive)
    const durationDays = differenceInDays(newEndDate, newStartDate) + 1;

    const booking = await prisma.bookingPeriod.update({
      where: { id: bookingId },
      data: {
        new_start_date: newStartDate,
        new_end_date: newEndDate,
        isEdited: true,
        duration_days: durationDays
      }
    });

    return booking;

  } catch (error) {
    console.error("Error editing booking dates:", error);
    throw new Error("Could not edit booking");
  }
}

    // delete existing booking
    async deleteBooking(bookingId: string) {
        try {
            // Mark the booking as deleted
            const booking = await prisma.bookingPeriod.update({
                where:{id: bookingId},
                data:{
                    isDeleted: true
                }
            })
            const deleted = await prisma.deletedBooking.create({
                data:{
                    booking_period_id: bookingId
                }
            })  

            return booking;
        } catch (error) {
            throw new Error ("Could not delete booking")
        }
    }

async expireBookings() {
  try {
    const bookings = await prisma.bookingPeriod.findMany({
      where: {
        OR: [
          { expired: true },
          { isDeleted: true }
        ]
      },
      include: {
        transaction: {
          select: {
            id: true,
            email: true,
            amount: true,
            phone_number: true,
            metadata: true,
            agent: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
        },
      },
      apartment: {
        select: {
          id: true, 
          name: true,
      },
      }
    }
    });

    // return completed and deleted bookings

    return bookings;
  } catch (error) {
    throw new Error("Could not fetch expired bookings");
  }
}

async getDeletedBookings(){
  try {
    const bookings = await prisma.deletedBooking.findMany({
      include: {
        booking_period: {
          include: {
            transaction: true,
            apartment: true
          }
        }
      }
    })
    return bookings
  } catch (error: any) {
    throw new Error(`${error.message}`)
  }
}

// agent booking 
}

export default new BookingService();