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

export const getBookingById = async (req:Request, res:Response)=>{
  const {id} =  req.params
  try { 
    const booking = await bookingService.bookingById(id) 
    res.json(booking)
  } catch (error: any) {
    res.status(500).json(`${error.message}`)
  }
}

export const fetchBookingDates = async (req: Request, res: Response) => {
  try {
    const { apartmentId } = req.params;
    const dates = await bookingService.getBookingDates(apartmentId);
    res.json(dates);
  } catch (error) {
    console.error("Error fetching booking dates:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export const manageBooking = async (req: Request, res: Response) => {
  try {
    const { email, phoneNumber } = req.query as any;
    const result = await bookingService.manageBooking(email, phoneNumber);
    res.status(200).json({ message: "Booking managed successfully", data: result });
  } catch (error) {
    console.error("Error managing booking:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}


