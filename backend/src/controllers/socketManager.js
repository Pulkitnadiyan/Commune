import { Server } from "socket.io"
import { Meeting } from "../models/meeting.model.js";


let connections = {}
let messages = {}
let timeOnline = {}
let roomCreators = {}; // To store creatorSocketId per room

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    });


    io.on("connection", (socket) => {

        console.log("SOMETHING CONNECTED")

        socket.on("join-call", async (roomUrl, username) => {

            const path = roomUrl.substring(roomUrl.lastIndexOf('/') + 1);

            try {
                const meeting = await Meeting.findOne({ meetingCode: path });

                if (!meeting) {
                    socket.emit('meeting-error', 'Meeting not found');
                    return;
                }

                if (!meeting.isActive) {
                    socket.emit('meeting-error', 'Meeting has ended');
                    return;
                }

                // Add participant to meeting in DB
                if (!meeting.participants.includes(socket.id)) {
                    meeting.participants.push(socket.id);
                    await meeting.save();
                }

                socket.join(path);

                if (connections[path] === undefined) {
                    connections[path] = []
                }
                connections[path].push(socket.id)

                timeOnline[socket.id] = new Date();

                // Set creator if this is the first person to join
                if (!roomCreators[path]) {
                    roomCreators[path] = socket.id;
                }

                for (let a = 0; a < connections[path].length; a++) {
                    io.to(connections[path][a]).emit("user-joined", socket.id, connections[path], username, roomCreators[path])
                }

                if (messages[path] !== undefined) {
                    for (let a = 0; a < messages[path].length; ++a) {
                        io.to(socket.id).emit("chat-message", messages[path][a]['data'],
                            messages[path][a]['sender'], messages[path][a]['socket-id-sender'])
                    }
                }

            } catch (error) {
                console.error("Error joining call:", error);
                socket.emit('meeting-error', 'Failed to join meeting');
            }
        })

        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        })

        socket.on("chat-message", (data, sender) => {

            const [matchingRoom, found] = Object.entries(connections)
                .reduce(([room, isFound], [roomKey, roomValue]) => {


                    if (!isFound && roomValue.includes(socket.id)) {
                        return [roomKey, true];
                    }

                    return [room, isFound];

                }, ['', false]);

            if (found === true) {
                if (messages[matchingRoom] === undefined) {
                    messages[matchingRoom] = []
                }

                messages[matchingRoom].push({ 'sender': sender, "data": data, "socket-id-sender": socket.id })
                console.log("message", matchingRoom, ":", sender, data)

                connections[matchingRoom].forEach((elem) => {
                    io.to(elem).emit("chat-message", data, sender, socket.id)
                })
            }

        })

        socket.on("end-meeting", async (meetingCode) => {
            if (roomCreators[meetingCode] === socket.id) {
                try {
                    await Meeting.updateOne({ meetingCode: meetingCode }, { $set: { isActive: false } });
                    io.to(meetingCode).emit('meeting-ended-by-creator'); // Notify all participants
                    console.log(`Meeting ${meetingCode} ended by creator ${socket.id}`);
                } catch (error) {
                    console.error("Error ending meeting:", error);
                }
            }
        });

        socket.on("disconnect", async () => {

            var diffTime = Math.abs(timeOnline[socket.id] - new Date())

            var key

            for (const [k, v] of JSON.parse(JSON.stringify(Object.entries(connections)))) {

                for (let a = 0; a < v.length; ++a) {
                    if (v[a] === socket.id) {
                        key = k

                        for (let a = 0; a < connections[key].length; ++a) {
                            io.to(connections[key][a]).emit('user-left', socket.id)
                        }

                        var index = connections[key].indexOf(socket.id)

                        connections[key].splice(index, 1)


                        if (connections[key].length === 0) {
                            delete connections[key]
                            // If the last person leaves, and they were the creator, clear creator
                            if (roomCreators[key] === socket.id) {
                                delete roomCreators[key];
                            }
                        }

                        // If the creator disconnects, end the meeting
                        if (roomCreators[key] === socket.id) {
                            try {
                                await Meeting.updateOne({ meetingCode: key }, { $set: { isActive: false } });
                                io.to(key).emit('meeting-ended-by-creator'); // Notify all participants
                                console.log(`Meeting ${key} ended by creator ${socket.id} due to disconnect`);
                                delete roomCreators[key]; // Clear creator for this room
                            } catch (error) {
                                console.error("Error ending meeting on disconnect:", error);
                            }
                        }


                        try {
                            const meeting = await Meeting.findOne({ meetingCode: key });
                            if (meeting) {
                                meeting.duration += diffTime;
                                // Remove disconnected participant from the participants array
                                meeting.participants = meeting.participants.filter(id => id !== socket.id);
                                await meeting.save();
                            }
                        } catch (error) {
                            console.error("Error updating meeting duration or participants on disconnect:", error);
                        }
                    }
                }

            }


        })


    })


    return io;
}

