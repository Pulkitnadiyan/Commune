import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AuthContext } from '../contexts/AuthContext';
import { Snackbar, Alert } from '@mui/material';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';



// TODO remove, this demo shouldn't need to reset the theme.

const defaultTheme = createTheme({
    palette: {
        primary: {
            main: '#3f51b5 ', // A shade of blue
        },
        secondary: {
            main: '#42a5f5', // Another shade of blue
        },
    },
});

export default function Authentication() {

    

    const [username, setUsername] = React.useState();
    const [password, setPassword] = React.useState();
    const [name, setName] = React.useState();
    const [error, setError] = React.useState();
    const [message, setMessage] = React.useState();


    const [formState, setFormState] = React.useState(0);

    const [open, setOpen] = React.useState(false)


    const { handleRegister, handleLogin, handleGuestLogin } = React.useContext(AuthContext);

    let handleGuest = async () => {
        try {
            await handleGuestLogin();
        } catch (err) {
            console.log(err);
            let message = (err.response.data.message);
            setError(message);
        }
    }

    let handleAuth = async () => {
        try {
            if (formState === 0) {

                let result = await handleLogin(username, password)


            }
            if (formState === 1) {
                let result = await handleRegister(name, username, password);
                console.log(result);
                setUsername("");
                setMessage(result);
                setOpen(true);
                setError("")
                setFormState(0)
                setPassword("")
            }
        } catch (err) {

            console.log(err);
            let message = (err.response.data.message);
            setError(message);
        }
    }


    return (
        <ThemeProvider theme={defaultTheme}>
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'url("background.png")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    padding: 2,
                    color: 'white',
                }}
            >
                <CssBaseline />
                <Box sx={{
                    width: '100%',
                    padding: '1.6rem 1.2rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 1,
                }}>
                    <Typography variant="h4" component="h1" sx={{
                        fontWeight: 'bold',
                        color: 'white',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                    }}>
                        Commune
                    </Typography>
                </Box>
                <Paper elevation={10} sx={{ padding: 5, borderRadius: 3, maxWidth: 450, width: '100%', mt: 8, backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            mt: 2,
                        }}
                    >
                        <Avatar sx={{ m: 1, bgcolor: '#3f51b5 ' }}>
                            <LockOutlinedIcon />
                        </Avatar>
                        <Typography component="h1" variant="h5" sx={{ mt: 2, mb: 2, color: '#333' }}>
                            {formState === 0 ? "Sign In" : "Sign Up"}
                        </Typography>

                        <Box sx={{ width: '100%', mb: 2 }}>
                            <ToggleButtonGroup
                                value={formState}
                                exclusive
                                onChange={(event, newFormState) => {
                                    if (newFormState !== null) {
                                        setFormState(newFormState);
                                        setError("");
                                    }
                                }}
                                aria-label="text alignment"
                                fullWidth
                            >
                                <ToggleButton value={0} aria-label="left aligned">
                                    Sign In
                                </ToggleButton>
                                <ToggleButton value={1} aria-label="centered">
                                    Sign Up
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Box>

                        <Box component="form" noValidate sx={{ mt: 1, width: '100%' }}>
                            {formState === 1 && (
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    id="fullName"
                                    label="Full Name"
                                    name="fullName"
                                    value={name}
                                    autoFocus
                                    onChange={(e) => setName(e.target.value)}
                                    variant="outlined"
                                />
                            )}

                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="username"
                                label="Username"
                                name="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                variant="outlined"
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label="Password"
                                value={password}
                                type="password"
                                onChange={(e) => setPassword(e.target.value)}
                                id="password"
                                variant="outlined"
                            />

                            {error && (
                                <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
                                    {error}
                                </Alert>
                            )}

                            <Button
                                type="button"
                                fullWidth
                                variant="contained"
                                sx={{
                                    mt: 3,
                                    mb: 2,
                                    py: 1.5,
                                    borderRadius: '8px',
                                    background: 'linear-gradient(45deg, #3f51b5  30%, #3f51b5  90%)',
                                    color: 'white',
                                    '&:hover': {
                                        opacity: 0.9,
                                    },
                                }}
                                onClick={handleAuth}
                            >
                                {formState === 0 ? "Sign In" : "Sign Up"}
                            </Button>

                            <Button
                                type="button"
                                fullWidth
                                variant="outlined"
                                sx={{
                                    mt: 1,
                                    mb: 2,
                                    py: 1.5,
                                    borderRadius: '8px',
                                    borderColor: '#3f51b5 ',
                                    color: '#3f51b5',
                                    '&:hover': {
                                        backgroundColor: 'rgba(33, 150, 243, 0.1)',
                                        borderColor: '#3f51b5 ',
                                    },
                                }}
                                onClick={handleGuest}
                            >
                                Continue as Guest
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </ThemeProvider>
    );
}