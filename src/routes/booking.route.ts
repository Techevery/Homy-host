import { Router } from "express";
import { fetchAllBookings, getBookingById } from "../controllers/booking.controller";
import { authenticateAdmin } from "../middlewares/Admin";

const router = Router()

router.get("/", authenticateAdmin, fetchAllBookings)
router.get('/:id', authenticateAdmin, getBookingById)

export default router