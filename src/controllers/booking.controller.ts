import { Request, Response } from "express";
import bookingService from "../services/booking.service";

export const fetchAllBookings = async (req: Request, res: Response) => {
  try {
    const bookings = await bookingService.getAllBookingsForAdmin();
    res.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const gerBookingById = async (req:Request, res:Response)=>{
  const {id} =  req.params
  try {
    const booking = await bookingService.bookingById(id)
    res.json(booking)
  } catch (error: any) {
    res.status(500).json(`${error.message}`)
  }
}


