import { Router } from "express";
import { createMeeting, joinMeeting, leaveMeeting } from "../controllers/meeting.controller.js";

const router = Router();

router.post("/create", createMeeting);
router.post("/join", joinMeeting);
router.post("/leave", leaveMeeting);

export default router;
