import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Container,
  Stack,
  Button,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PanelLayout = ({ title, subtitle, actions, children, darkMode, setDarkMode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const toggleDarkMode = () => {
    if (setDarkMode) {
      setDarkMode(!darkMode);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{ 
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          backgroundColor: 'background.paper',
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', py: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ fontFamily: 'Poppins' }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Poppins' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={2} alignItems="center">
            {setDarkMode && (
              <Tooltip title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
                <IconButton onClick={toggleDarkMode} color="inherit" sx={{ ml: 1 }}>
                  {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                </IconButton>
              </Tooltip>
            )}
            <Chip label={user?.userType} color="primary" variant="outlined" sx={{ fontFamily: 'Poppins' }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Poppins' }}>
              {user?.username}
            </Typography>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{ borderRadius: 50, fontFamily: 'Poppins' }}
            >
              Logout
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {actions && (
          <Box sx={{ mb: 3 }}>
            {actions}
          </Box>
        )}
        {children}
      </Container>
    </Box>
  );
};

export default PanelLayout;

