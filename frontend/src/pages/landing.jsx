import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Container, AppBar, Toolbar } from '@mui/material';

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <Box sx={{
            backgroundImage: `url("background.png")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            minHeight: '100vh'
        }}>
            <AppBar position="static" color="transparent" elevation={0}> 
                <Toolbar>
                    <Typography variant="h4" component="h1" sx={{ flexGrow: 1, fontWeight: 'bold', color: '#3f51b5 ' }}>
                        Commune
                    </Typography>
                    <Button sx={{ fontWeight: 'bold', color: 'white' }} onClick={() => navigate("/auth")}>Login</Button>
                    <Button sx={{ fontWeight: 'bold', color: 'white' }} onClick={() => navigate("/auth")}>Register</Button>
                </Toolbar>
            </AppBar>

            <Container maxWidth="lg" sx={{ mt: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ maxWidth: '50%' }}>
                    <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'white' }}>
                        <span style={{ color:" #3f51b5 " }}>Connect</span> with your loved ones.
                    </Typography>
                    <Typography variant="h5" paragraph sx={{ color: 'white' }}>
                        Cover any distance with a Commune call. High-quality video meetings, for free.
                    </Typography>
                    <Button variant="contained" size="large" onClick={() => navigate("/auth")} sx={{ 
                        mt: 4, 
                        py: 1.5, 
                        px: 4, 
                        borderRadius: '20px', 
                        backgroundColor: 'rgb(63, 81, 181)', 
                        '&:hover': { backgroundColor: 'rgb(48, 63, 159)' } 
                    }}>
                        Get Started
                    </Button>
                </Box>
                <Box sx={{ maxWidth: '45%' }}>
                    <img src="/mobile.png" alt="" style={{ width: '100%', height: 'auto', borderRadius: '20px' }} />
                </Box>
            </Container>
        </Box>
    );
}
