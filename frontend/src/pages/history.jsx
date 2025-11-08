import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, Box, CardContent, Typography, AppBar, Toolbar, IconButton, Grid } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';

export default function History() {
    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();
                setMeetings(history);
            } catch (error) {
                console.error("Failed to fetch history:", error);
                // IMPLEMENT SNACKBAR for error feedback
            }
        };
        fetchHistory();
    }, [getHistoryOfUser]);

    const formatDuration = (milliseconds) => {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    return (
        <Box sx={{ flexGrow: 1, background: 'linear-gradient(45deg, #3f51b5 30%, #535d95ff 90%)', minHeight: '100vh' }}>
            <AppBar position="static" color="transparent" elevation={0}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'white', fontWeight: 'bold' }}>
                        Meeting History
                    </Typography>
                    <IconButton onClick={() => navigate("/home")} sx={{ color: 'white' }}>
                        <HomeIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                    {meetings.length > 0 ? meetings.map((meeting, i) => (
                        <Grid item xs={12} sm={6} md={4} key={i}>
                            <Card variant="outlined" sx={{ borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
                                <CardContent>
                                    <Typography sx={{ fontSize: 14, fontWeight: 'bold' }} color="text.secondary" gutterBottom>
                                        Code: {meeting.meetingCode}
                                    </Typography>
                                    <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                        Date: {formatDate(meeting.date)}
                                    </Typography>
                                    <Typography variant="body2">
                                        Duration: {formatDuration(meeting.duration)}
                                    </Typography>
                                    <Typography variant="body2">
                                        Participants: {meeting.participants.length}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    )) : (
                        <Typography sx={{ textAlign: 'center', width: '100%', mt: 4, color: 'white' }}>
                            No meeting history found.
                        </Typography>
                    )}
                </Grid>
            </Box>
              </Box>
        //</div>
    );
}
