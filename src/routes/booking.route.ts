import { Router } from "express";
import { deleteBooking, editBookingDates, fetchAllBookings, fetchBookingDates, getBookingById, manageBooking } from "../controllers/booking.controller";
import { authenticateAdmin } from "../middlewares/Admin";

const router = Router()

router.get("/", authenticateAdmin, fetchAllBookings)
router.get("/booking-dates/:apartmentId", fetchBookingDates) 
router.get("/manage-booking", manageBooking) 
router.get('/:id', authenticateAdmin, getBookingById)    

// update admin booking     
router.patch("/edit-booking/:bookingId", authenticateAdmin, editBookingDates)
// delete booking 
router.post("/delete-booking/:bookingId", authenticateAdmin, deleteBooking)
export default router  