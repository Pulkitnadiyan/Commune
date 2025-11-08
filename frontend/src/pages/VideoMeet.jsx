import React, { useEffect, useRef, useState, useContext } from 'react';
import io from "socket.io-client";
import { Badge, IconButton, TextField, Button, Box, Typography, Paper, Grid, Menu, MenuItem, ListItemText } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';
import server from '../environment';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const Video = ({ stream }) => {
    const ref = useRef();

    useEffect(() => {
        if (ref.current) {
            ref.current.srcObject = stream;
        } 
    }, [stream]);

    return (
        <Box sx={{ position: 'relative' }}>
            <video ref={ref} autoPlay playsInline style={{ width: '98%', borderRadius: '10px', maxHeight: 'calc(50vh - 20px)', objectFit: 'cover' }} />
            {stream?.username && <Typography sx={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.5)', p: '2px 8px', borderRadius: 1 }}>{stream.username}</Typography>}
        </Box>
    );
};

const server_url = server;

var connections = {};

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}

export default function VideoMeetComponent() {

    const navigate = useNavigate();
    var socketRef = useRef();
    let socketIdRef = useRef();

    let localVideoref = useRef();
    const localStreamRef = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);
    let [audioAvailable, setAudioAvailable] = useState(true);
    let [video, setVideo] = useState(true);
    let [audio, setAudio] = useState(true);
    let [screen, setScreen] = useState();
    let [showModal, setModal] = useState(false);
    let [screenAvailable, setScreenAvailable] = useState();
    let [messages, setMessages] = useState([])
    let [message, setMessage] = useState("");
    let [newMessages, setNewMessages] = useState(0);
    let [askForUsername, setAskForUsername] = useState(true);
    let [username, setUsername] = useState("");
    let [videos, setVideos] = useState([])
    const [meetingCode, setMeetingCode] = useState("");
    const [isCreator, setIsCreator] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);


    useEffect(() => {
        const url = window.location.href;
        const code = url.substring(url.lastIndexOf('/') + 1);
        setMeetingCode(code);
        getPermissions();
    }, [])

    useEffect(() => {
        if (localVideoref.current && window.localStream) {
            localVideoref.current.srcObject = window.localStream;
        }
    }, [askForUsername]);

    let getDislayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDislayMediaSuccess)
                    .catch((e) => console.log(e))
            }
        }
    }

    const getPermissions = async () => {
        let stream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setVideoAvailable(true);
            setAudioAvailable(true);
        } catch (err) {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                setVideoAvailable(true);
                setAudioAvailable(false);
                setAudio(false);
            } catch (err) {
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
                    setVideoAvailable(false);
                    setAudioAvailable(true);
                    setVideo(false);
                } catch (err) {
                    setVideoAvailable(false);
                    setAudioAvailable(false);
                    setVideo(false);
                    setAudio(false);
                    return;
                }
            }
        }

        if (stream) {
            window.localStream = stream;
            localStreamRef.current = stream;
            window.localStream.username = username;
            if (localVideoref.current) {
                localVideoref.current.srcObject = stream;
            }
        }

        if (navigator.mediaDevices.getDisplayMedia) {
            setScreenAvailable(true);
        } else {
            setScreenAvailable(false);
        }
    };

    let getMedia = () => {
        connectToSocketServer();
    }

    let getDislayMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            window.localStream.getTracks().forEach(track => {
                connections[id].addTrack(track, window.localStream);
            });

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false)

            window.localStream = localStreamRef.current;
            localVideoref.current.srcObject = window.localStream;

            for (let id in connections) {
                if (id === socketIdRef.current) continue
    
                window.localStream.getTracks().forEach(track => {
                    connections[id].addTrack(track, window.localStream);
                });
    
                connections[id].createOffer().then((description) => {
                    connections[id].setLocalDescription(description)
                        .then(() => {
                            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                        })
                        .catch(e => console.log(e))
                })
            }
        })
    }

    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message)

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                    }
                }).catch(e => console.log(e))
            }

            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
            }
        }
    }

    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false })

        const createPeerConnection = (socketListId) => {
            const peerConnection = new RTCPeerConnection(peerConfigConnections);
            connections[socketListId] = peerConnection;

            peerConnection.onicecandidate = function (event) {
                if (event.candidate != null) {
                    socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }));
                }
            }

            peerConnection.ontrack = (event) => {
                console.log("ontrack event fired for socketId:", socketListId);
                setVideos(prevVideos => {
                    const videoIndex = prevVideos.findIndex(video => video.socketId === socketListId);
                    if (videoIndex !== -1) {
                        const updatedVideos = [...prevVideos];
                        const updatedVideo = { ...updatedVideos[videoIndex] };
                        updatedVideo.stream = event.streams[0];
                        updatedVideos[videoIndex] = updatedVideo;
                        return updatedVideos;
                    } else {
                        return [...prevVideos, { socketId: socketListId, stream: event.streams[0], username: connections[socketListId].username }];
                    }
                });
            };

            if (window.localStream) {
                window.localStream.getTracks().forEach(track => peerConnection.addTrack(track, window.localStream));
            }
        };

        socketRef.current.on('signal', gotMessageFromServer)

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', window.location.href, username);
            socketIdRef.current = socketRef.current.id

            socketRef.current.on('chat-message', addMessage)

            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id))
                if (connections[id]) {
                    connections[id].close();
                    delete connections[id];
                }
            })

            socketRef.current.on('control-action', (action) => {
                switch (action) {
                    case 'mute':
                        if (audio) { // Only mute if not already muted
                            handleAudio();
                        }
                        break;
                    case 'videoOff':
                        if (video) { // Only turn off video if not already off
                            handleVideo();
                        }
                        break;
                    case 'ban':
                        handleLeaveCall(false); // Reuse end call logic to disconnect and navigate
                        break;
                    default:
                        console.log('Unknown control action received:', action);
                }
            });

            socketRef.current.on('user-joined', (id, username, creatorSocketId) => {
                createPeerConnection(id);
                setIsCreator(socketIdRef.current === creatorSocketId);
                connections[id].createOffer().then((description) => {
                    connections[id].setLocalDescription(description)
                        .then(() => {
                            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                        })
                        .catch(e => console.log(e))
                })
                setVideos(prevVideos => [...prevVideos, { socketId: id, username, stream: null }]);
            })

            socketRef.current.on('all-users', (users) => {
                users.forEach((user) => {
                    createPeerConnection(user.id);
                    connections[user.id].createOffer().then((description) => {
                        connections[user.id].setLocalDescription(description)
                            .then(() => {
                                socketRef.current.emit('signal', user.id, JSON.stringify({ 'sdp': connections[user.id].localDescription }))
                            })
                            .catch(e => console.log(e))
                    })
                })
                setVideos(users.map(user => ({ socketId: user.id, username: user.username, stream: null })));
            })
        })
    }

    const stopAllTracks = () => {
        if (window.localStream) {
            window.localStream.getTracks().forEach(track => track.stop());
        }
    };

    let handleVideo = () => {
        const newVideoState = !video;
        setVideo(newVideoState);
        if (window.localStream) {
            const videoTrack = window.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = newVideoState;
            }
        }
    }

    let handleAudio = () => {
        const newAudioState = !audio;
        setAudio(newAudioState);
        if (window.localStream) {
            const audioTrack = window.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = newAudioState;
            }
        }
    }

    useEffect(() => {
        if (screen !== undefined) {
            getDislayMedia();
        }
    }, [screen])

    let handleScreen = () => {
        setScreen(!screen);
    }

    let handleLeaveCall = async (endMeeting) => {
        stopAllTracks();

        try {
            const token = localStorage.getItem("token");
            await fetch(`${server}/api/meeting/leave`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ meetingCode, token }),
            });
        } catch (error) {
            console.error("Failed to leave meeting:", error);
        }

        if (endMeeting && isCreator) {
            const token = localStorage.getItem("token");
            socketRef.current.emit('end-meeting', meetingCode, token);
        }
        navigate("/home");
    }

    const toggleChat = () => {
        setModal(prevShowModal => {
            if (!prevShowModal) {
                setNewMessages(0);
            }
            return !prevShowModal;
        });
    };

    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prevNewMessages) => prevNewMessages + 1);
        }
    };

    let sendMessage = () => {
        socketRef.current.emit('chat-message', message, username)
        setMessage("");
    }

    let connect = () => {
        setAskForUsername(false);
        getMedia();
    }

    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleMuteParticipant = (socketId) => {
        socketRef.current.emit('control-participant', { targetId: socketId, action: 'mute' });
        handleMenuClose();
    };

    const handleVideoOffParticipant = (socketId) => {
        socketRef.current.emit('control-participant', { targetId: socketId, action: 'videoOff' });
        handleMenuClose();
    };

    const handleBanParticipant = (socketId) => {
        socketRef.current.emit('control-participant', { targetId: socketId, action: 'ban' });
        handleMenuClose();
    };


    return (
        <Box sx={{ backgroundColor: '#202124', minHeight: '100vh', color: 'white' }}>
            {askForUsername ? (
                <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="100vh">
                    <Typography variant="h4" gutterBottom>Enter Lobby</Typography>
                    <Paper elevation={3} sx={{ p: 4, borderRadius: '16px', background: 'white', width: '90%', maxWidth: '500px' }}>
                        <TextField
                            fullWidth
                            label="Username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            variant="outlined"
                            sx={{ mb: 2, input: { color: 'white' }, label: { color: 'gray' } }}
                        />
                        <Box display="flex" justifyContent="center" gap={2} mb={2}>
                            <IconButton onClick={handleVideo} sx={{ color: video ? '#3f51b5' : '#f28b82', border: '1px solid' }}>
                                {video ? <VideocamIcon /> : <VideocamOffIcon />}
                            </IconButton>
                            <IconButton onClick={handleAudio} sx={{ color: audio ? '#3f51b5' : '#f28b82', border: '1px solid' }}>
                                {audio ? <MicIcon /> : <MicOffIcon />}
                            </IconButton>
                        </Box>
                        <Button variant="contained" onClick={connect} disabled={!username} fullWidth sx={{ py: 1.5, background: '#3f51b5', '&:hover': { background: '#3c4eb6ff' } }}>
                            Connect
                        </Button>
                        <Box mt={2} borderRadius="10px" overflow="hidden" border="2px solid #3f51b5">
                            <video ref={localVideoref} autoPlay muted style={{ width: '100%' }}></video>
                        </Box>
                    </Paper>
                </Box>
            ) : (
                <Box display="flex" flexDirection="column" height="100vh">
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
                        <Typography sx={{ background: 'rgba(0,0,0,0.5)', p: 1, borderRadius: 1 }}>Meeting Code: {meetingCode}</Typography>
                        <IconButton onClick={handleMenuClick} sx={{ color: 'white' }}>
                            <MoreVertIcon />
                        </IconButton>
                        <Menu
                            anchorEl={anchorEl}
                            open={open}
                            onClose={handleMenuClose}
                        >
                            <MenuItem disabled>
                                <ListItemText primary="Participants" />
                            </MenuItem>
                            {videos.filter(v => v.username).map((video) => (
                                <MenuItem key={video.socketId} onClick={handleMenuClose}>
                                    <ListItemText primary={video.username} />
                                    {isCreator && (
                                        <>
                                            <IconButton size="small" onClick={() => handleMuteParticipant(video.socketId)}><MicOffIcon fontSize="small" /></IconButton>
                                            <IconButton size="small" onClick={() => handleVideoOffParticipant(video.socketId)}><VideocamOffIcon fontSize="small" /></IconButton>
                                            <IconButton size="small" onClick={() => handleBanParticipant(video.socketId)}><PersonOffIcon fontSize="small" /></IconButton>
                                        </>
                                    )}
                                </MenuItem>
                            ))}
                            {videos.filter(v => v.username).length === 0 && (
                                <MenuItem onClick={handleMenuClose}>
                                    <ListItemText primary="No other participants" sx={{ fontStyle: 'italic', color: 'text.secondary' }} />
                                </MenuItem>
                            )}
                        </Menu>
                    </Box>
                    <Grid container spacing={2} sx={{ flexGrow: 1, p: 2 }}>
                        <Grid item xs={12} md={showModal ? 9 : 12} container spacing={2} alignItems="center" justifyContent="center">
                            {
                                (() => {
                                    const totalParticipants = videos.length + 1;
                                    let gridSize = 12; // Default for 1 participant
                                    if (totalParticipants === 2) {
                                        gridSize = 6;
                                    } else if (totalParticipants === 3) {
                                        gridSize = 4;
                                    } else if (totalParticipants === 4) {
                                        gridSize = 3;
                                    } else if (totalParticipants >= 5) {
                                        gridSize = 2;
                                    }

                                    return (
                                        <>
                                            <Grid item xs={gridSize}>
                                                <Box sx={{ position: 'relative' }}>
                                                    <video ref={localVideoref} autoPlay muted style={{ width: '98%', borderRadius: '10px', maxHeight: 'calc(50vh - 20px)', objectFit: 'cover' }}></video>
                                                    <Typography sx={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.5)', p: '2px 8px', borderRadius: 1 }}>{username} (You)</Typography>
                                                </Box>
                                            </Grid>
                                            {videos.map((video) => (
                                                <Grid item xs={gridSize} key={video.socketId}>
                                                    {video.stream && <Video stream={video.stream} />}
                                                    <Typography sx={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.5)', p: '2px 8px', borderRadius: 1 }}>{video.username}</Typography>
                                                </Grid>
                                            ))}
                                        </>
                                    );
                                })()
                            }
                        </Grid>
                        {showModal && (
                            <Grid item xs={12} md={3}>
                                <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#292a2d', borderRadius: '10px' }}>
                                    <Typography variant="h6" sx={{ p: 2, borderBottom: '1px solid #5f6368' }}>Chat</Typography>
                                    <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto' }}>
                                        {messages.length > 0 ? messages.map((item, index) => (
                                            <Box key={index} sx={{ mb: 1 }}>
                                                <Typography variant="caption" sx={{ color: '#8ab4f8' }}>{item.sender}</Typography>
                                                <Typography>{item.data}</Typography>
                                            </Box>
                                        )) : <Typography>No Messages Yet</Typography>}
                                    </Box>
                                    <Box display="flex" p={2} borderTop="1px solid #5f6368">
                                        <TextField fullWidth size="small" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Enter Your chat" variant="outlined" sx={{ mr: 1, input: { color: 'white' }, fieldset: { borderColor: 'gray' } }} />
                                        <Button variant='contained' onClick={sendMessage} sx={{ background: '#8ab4f8' }}>Send</Button>
                                    </Box>
                                </Paper>
                            </Grid>
                        )}
                    </Grid>
                    <Box display="flex" justifyContent="center" alignItems="center" p={2} sx={{ background: '#292a2d' }}>
                        <IconButton onClick={handleVideo} sx={{ color: video ? 'white' : '#f28b82' }}><VideocamIcon /></IconButton>
                        <IconButton onClick={() => handleLeaveCall(true)} sx={{ color: 'white', background: '#ea4335', mx: 2, '&:hover': { background: '#d93025' } }}><CallEndIcon /></IconButton>
                        <IconButton onClick={handleAudio} sx={{ color: audio ? 'white' : '#f28b82' }}><MicIcon /></IconButton>
                        {screenAvailable && <IconButton onClick={handleScreen} sx={{ color: 'white' }}>{screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}</IconButton>}
                        <Badge badgeContent={newMessages} color="error">
                            <IconButton onClick={toggleChat} sx={{ color: 'white' }}><ChatIcon /></IconButton>
                        </Badge>
                    </Box>
                </Box>
            )}
        </Box>
    );
}
