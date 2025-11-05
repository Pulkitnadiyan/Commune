import React, { useContext, useState } from 'react';
import withAuth from '../utils/withAuth';
import { useNavigate } from 'react-router-dom';
import { Button, TextField, AppBar, Toolbar, Typography, Box, Grid, Paper } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import { AuthContext } from '../contexts/AuthContext';

function HomeComponent() {
    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState('');
    const { addToUserHistory, createMeeting, handleLogout } = useContext(AuthContext);

    const handleJoinVideoCall = async () => {
        if (meetingCode) {
            await addToUserHistory(meetingCode);
            navigate(`/${meetingCode}`);
        }
    };

    const handleCreateMeeting = async () => {
        try {
            const response = await createMeeting();
            await addToUserHistory(response.meetingCode);
            navigate(`/${response.meetingCode}`);
        } catch (error) {
            console.error('Error creating meeting:', error);
        }
    };

    return (
        <Box sx={{ flexGrow: 1, backgroundImage: `url("background.png")`, backgroundSize: 'cover', backgroundPosition: 'center', minHeight: '100vh' }}>
            <AppBar position="static" color="transparent" elevation={0}>
                <Toolbar>
                    <Typography variant="h5" component="div" sx={{ flexGrow: 1, fontWeight: 'bold', color: '#3f51b5 ' }}>
                        Commune
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<RestoreIcon />}
                        onClick={() => navigate('/history')}
                        sx={{ textTransform: 'none', fontWeight: 'bold', color: 'white', backgroundColor: 'rgb(63, 81, 181)', '&:hover': { backgroundColor: 'rgb(48, 63, 159)' } }}
                    >
                        History
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleLogout}
                        sx={{ textTransform: 'none', fontWeight: 'bold', color: 'white', backgroundColor: 'rgb(63, 81, 181)', '&:hover': { backgroundColor: 'rgb(48, 63, 159)' } }}
                    >
                        Logout
                    </Button>
                </Toolbar>
            </AppBar>

            <Grid container spacing={2} sx={{ p: 4 }} alignItems="center" justifyContent="center">
                <Grid item xs={12} md={6}>
                    <Paper elevation={6} sx={{ p: 5, borderRadius: '16px', backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
                        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'rgb(63, 81, 181)' }}>
                            Premium video meetings.
                        </Typography>
                        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'rgb(63, 81, 181)' }}>
                            Now free for everyone.
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 3, color: '#424242' }}>
                            We re-engineered the service we built for secure business meetings, Commune, to make it free and available for all.
                        </Typography>

                        <Box sx={{ display: 'flex', gap: '10px', mb: 2 }}>
                            <TextField
                                fullWidth
                                onChange={(e) => setMeetingCode(e.target.value)}
                                id="outlined-basic"
                                label="Enter a code or link"
                                variant="outlined"
                            />
                            <Button
                                onClick={handleJoinVideoCall}
                                variant="contained"
                                disabled={!meetingCode}
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 'bold',
                                    borderRadius: '8px',
                                    background: 'linear-gradient(45deg, rgb(63, 81, 181) 30%, rgb(63, 81, 181) 90%)',
                                    color: 'white',
                                    '&:hover': {
                                        opacity: 0.9,
                                    },
                                }} >
                                Join
                            </Button>
                        </Box>

                        <Button
                            onClick={handleCreateMeeting}
                            variant="outlined"
                            startIcon={<VideoCallIcon />}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 'bold',
                                borderRadius: '8px',
                                borderColor: 'rgb(63, 81, 181)',
                                color: 'rgb(63, 81, 181)',
                                '&:hover': {
                                    borderColor: 'rgb(63, 81, 181)',
                                    color: 'rgb(63, 81, 181)',
                                    backgroundColor: 'rgba(63, 81, 181, 0.04)',
                                },
                            }} >
                            New meeting
                        </Button>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
                    <img srcSet="/logo3.png" alt="Meeting" style={{ maxWidth: '90%', height: 'auto', borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }} />
                </Grid>
            </Grid>
        </Box>
    );
}


export default withAuth(HomeComponent)