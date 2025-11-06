import { Router } from "express";
import { updateMeetingHistory, getUserHistory, login, register, guestLogin } from "../controllers/user.controller.js";

const router = Router();

router.route("/login").post(login)
router.route("/register").post(register)
router.route("/add_to_activity").post(updateMeetingHistory)
router.route("/get_all_activity").get(getUserHistory)
router.route("/guest").post(guestLogin)

export default router;