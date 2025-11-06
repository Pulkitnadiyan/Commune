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
                if (!meeting.participants.includes(username)) {
                    meeting.participants.push(username);
                    await meeting.save();
                }

                socket.join(path);

                if (connections[path] === undefined) {
                    connections[path] = []
                }
                connections[path].push({ id: socket.id, username: username })

                timeOnline[socket.id] = new Date();

                // Set creator if this is the first person to join
                if (!roomCreators[path]) {
                    roomCreators[path] = socket.id;
                }

                for (let a = 0; a < connections[path].length; a++) {
                    io.to(connections[path][a].id).emit("user-joined", socket.id, connections[path], { username }, roomCreators[path])
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


                    if (!isFound && roomValue.some(user => user.id === socket.id)) {
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
                    io.to(elem.id).emit("chat-message", data, sender, socket.id)
                })
            }

        })

        socket.on("end-meeting", async (meetingCode) => {
            if (roomCreators[meetingCode] === socket.id) {
                try {
                    const meeting = await Meeting.findOne({ meetingCode: meetingCode });
                    if (meeting) {
                        const duration = Object.values(timeOnline).reduce((acc, cur) => acc + (new Date() - cur), 0);
                        meeting.duration = duration;
                        meeting.isActive = false;
                        await meeting.save();
                    }

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

            for (const [k, v] of Object.entries(connections)) {

                const user = v.find(user => user.id === socket.id);
                const userIndex = v.findIndex(user => user.id === socket.id);

                if (userIndex !== -1) {
                    key = k

                    for (let a = 0; a < connections[key].length; ++a) {
                        io.to(connections[key][a].id).emit('user-left', socket.id)
                    }

                    connections[key].splice(userIndex, 1)


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
                            if (user) {
                                meeting.participants = meeting.participants.filter(u => u !== user.username);
                            }
                            await meeting.save();
                        }
                    } catch (error) {
                        console.error("Error updating meeting duration or participants on disconnect:", error);
                    }
                }

            }


        })

        socket.on('control-participant', (data) => {
            const { targetId, action } = data;
            const [matchingRoom] = Object.entries(connections).find(([, participants]) => participants.some(p => p.id === socket.id)) || [];
        
            if (matchingRoom && roomCreators[matchingRoom] === socket.id) {
                io.to(targetId).emit('control-action', action);
            }
        });


    })


    return io;
}

