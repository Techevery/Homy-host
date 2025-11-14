import { Router } from "express";
import { fetchAllBookings, fetchBookingDates, getBookingById, manageBooking } from "../controllers/booking.controller";
import { authenticateAdmin } from "../middlewares/Admin";

const router = Router()

router.get("/", authenticateAdmin, fetchAllBookings)
router.get("/booking-dates/:apartmentId", fetchBookingDates) 
router.get("/manage-booking", manageBooking) 
router.get('/:id', authenticateAdmin, getBookingById)    

export default router  