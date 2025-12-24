import { Router } from "express";
import { agentBookings, bookingRequest, deleteBooking, editBookingDates, expiredBookings, fetchAllBookings, fetchBookingDates, getBookingById, getDeletedBookings, manageBooking } from "../controllers/booking.controller";
import { authenticateAdmin } from "../middlewares/Admin";
import { authenticateAgent } from "../middlewares/Agent";

const router = Router()

router.get("/", authenticateAdmin, fetchAllBookings)
router.get("/booking-dates/:apartmentId", fetchBookingDates) 
router.get("/manage-booking", manageBooking) 

// agent bookings 
router.get("/agent-booking", authenticateAgent, agentBookings)  

// expoted booking 
router.get("/expire-bookings",authenticateAdmin, expiredBookings)
// booking request 
router.get("/request", authenticateAdmin, bookingRequest)
// deleted bookings 
router.get("/deleted-bookings", authenticateAdmin, getDeletedBookings)
router.get('/:id', authenticateAdmin, getBookingById)      

// update admin booking     
router.patch("/edit-booking/:bookingId", authenticateAdmin, editBookingDates)
// delete booking 
router.post("/delete-booking/:bookingId", authenticateAdmin, deleteBooking)
export default router   