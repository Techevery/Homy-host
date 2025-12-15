import { Request, Response } from "express";
import bookingService from "../services/booking.service";
import walletService from "../services/wallet.service";

export const fetchAllBookings = async (req: Request, res: Response) => {
  try {
    const bookings = await bookingService.getAllBookingsForAdmin();
    res.json(bookings);
  } catch (error) { 
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}; 

export const bookingRequest = async (req: Request, res: Response) => {
  try {
    const bookings = await bookingService.bookingRequest();
    res.json(bookings);
  } catch (error) { 
    console.error("Error fetching booking requests:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

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

export const agentBookings = async (req: Request, res: Response) => {
  try {
    const agentId = (req as any).agent.id
    const result = await bookingService.agentBookingDetails(agentId)
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json(`${error.message}`)
  }
}

export const editBookingDates = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const { newStartDate, newEndDate } = req.body;
    const result = await bookingService.editBookingDates(bookingId, newStartDate, newEndDate);
    res.status(200).json({ message: "Booking dates edited successfully", data: result });
  } catch (error) {
    console.error("Error editing booking dates:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export const deleteBooking = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const result = await bookingService.deleteBooking(bookingId);
    res.status(200).json({ message: "Booking deleted successfully", data: result });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export const getDeletedBookings = async (req: Request, res: Response) => {
  try {
    const bookings = await bookingService.getDeletedBookings();
    res.json(bookings);
  } catch (error) {
    console.error("Error fetching deleted bookings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export const expiredBookings = async (req: Request, res: Response) => {
  try {
    const result = await bookingService.expireBookings();
    res.status(200).json({ message: "Bookings expired successfully", data: result });
  } catch (error) {
    console.error("Error expiring bookings:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}


// rremove apartment true is the booking has expired 
// for payout create a crude or charges       