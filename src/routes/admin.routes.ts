import express from "express";
import * as Admin from "../controllers/admin.controller";
import { authenticateAdmin } from "../middlewares/Admin";
import * as adminController from "../controllers/admin.controller";
import * as apartmentController from "../controllers/apartment.controller";
import { restrictTo, Role } from "../middlewares/roles";
// import { restrictTo, Role, attachAdminToRequest } from '../middlewares/role.middleware';
const router = express.Router();

router.post( 
  "/upload-property",
  authenticateAdmin,
  // restrictTo(Role.SUPER_ADMIN),
  apartmentController.createApartment
); 

router.put("/verify-agent", authenticateAdmin, adminController.verifyAgent);

router.get( 
  "/list-apartments",
  authenticateAdmin,
  restrictTo(Role.SUPER_ADMIN),
  adminController.listProperties
);

// offline booking ,
router.post("/book", authenticateAdmin, adminController.offlineBoking )
router.get("/list-agents",authenticateAdmin, adminController.listAgents); 

// agent profile 
router.get("/agent-profile/:agentId", authenticateAdmin, Admin.agenProfileDetails)

router.get("/agents-profile", authenticateAdmin, Admin.getAgentProfile);

router.get("/admin-profile", authenticateAdmin, adminController.adminProfile);

router.patch( 
  "/edit-profile",
  authenticateAdmin,
  adminController.editAdminProfile
);

router.get(
  "/search-apartment",
  authenticateAdmin,
  apartmentController.searchApartment
);

router.get("/stats",  authenticateAdmin, adminController.getDashboardStats);

// suspend agent 
router.patch(
  "/suspend-agent",
  authenticateAdmin, 
    restrictTo(Role.SUPER_ADMIN),
  adminController.suspendAgentToggle 
);

router.delete(
  "/:apartmentId",
  authenticateAdmin,  
    restrictTo(Role.SUPER_ADMIN),
  apartmentController.deleteApartment
);   

router.post(
  "/get-transaction-details",
  authenticateAdmin,
    restrictTo(Role.SUPER_ADMIN),
  adminController.getTransactionDetailsByYear
);  

router.patch("/update-apartment/:apartmentId", authenticateAdmin, apartmentController.updateApartment)

// reject agent
router.delete("/reject/:agentId", authenticateAdmin, adminController.rejectAgent)

export default router;
