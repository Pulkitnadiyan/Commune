import { Meeting } from "../models/meeting.model.js";
import crypto from "crypto";
import httpStatus from "http-status";

const createMeeting = async (req, res) => {
    try {
        const meetingCode = crypto.randomBytes(4).toString('hex');
        const newMeeting = new Meeting({
            meetingCode: meetingCode,
        });
        await newMeeting.save();
        res.status(httpStatus.CREATED).json({ meetingCode });
    } catch (error) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Something went wrong" });
    }
};

const joinMeeting = async (req, res) => {
    const { meetingCode } = req.body;
    try {
        const meeting = await Meeting.findOne({ meetingCode });
        if (!meeting) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "Meeting not found" });
        }
        res.status(httpStatus.OK).json({ message: "Joined meeting successfully" });
    } catch (error) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Something went wrong" });
    }
};

export { createMeeting, joinMeeting };
