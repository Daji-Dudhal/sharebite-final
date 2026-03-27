import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Stack,
  Grid,
  TextField,
  MenuItem,
  Link,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { Visibility, VisibilityOff, HowToReg } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const userTypes = [
  { value: 'HOTEL', label: 'Hotel / Restaurant' },
  { value: 'NGO', label: 'NGO' },
  { value: 'VOLUNTEER', label: 'Volunteer' },
  { value: 'NEEDY', label: 'Needy Person' },
  { value: 'COMPOST_AGENCY', label: 'Compost Agency' },
];

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    phone: '',
    address: '',
    latitude: '',
    longitude: '',
    userType: 'HOTEL',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      };
      const response = await api.post('/auth/register', payload);
      const { token, username, userType, userId } = response.data;
      login(token, username, userType, userId);
      enqueueSnackbar('Registration successful! Welcome aboard.', { variant: 'success' });
      navigate('/login', { replace: true });
    } catch (err) {
      enqueueSnackbar(err.response?.data?.message || 'Registration failed. Please try again.', {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at top, #c8f8ff, #edf1f7)',
        py: 5,
      }}
    >
      <Container maxWidth="md">
        <Paper elevation={0} sx={{ p: { xs: 4, md: 6 }, borderRadius: 5 }}>
          <Stack spacing={2} textAlign="center" mb={3}>
            <Typography variant="overline" color="secondary">
              Join the movement
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              Create your Bite Sharing account
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Register as a donor, NGO, volunteer, needy person, or compost agency and start reducing
              food waste today.
            </Typography>
          </Stack>

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                select
                label="User Type"
                value={formData.userType}
                onChange={handleChange('userType')}
                required
                fullWidth
              >
                {userTypes.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Full Name / Organization"
                    value={formData.fullName}
                    onChange={handleChange('fullName')}
                    required
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Username"
                    value={formData.username}
                    onChange={handleChange('username')}
                    required
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange('email')}
                    required
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Phone"
                    value={formData.phone}
                    onChange={handleChange('phone')}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange('password')}
                    required
                    fullWidth
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword((prev) => !prev)} edge="end">
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Address"
                    value={formData.address}
                    onChange={handleChange('address')}
                    multiline
                    minRows={2}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Latitude"
                    value={formData.latitude}
                    onChange={handleChange('latitude')}
                    type="number"
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Longitude"
                    value={formData.longitude}
                    onChange={handleChange('longitude')}
                    type="number"
                    fullWidth
                  />
                </Grid>
              </Grid>

              <LoadingButton
                type="submit"
                variant="contained"
                size="large"
                loading={loading}
                startIcon={<HowToReg />}
              >
                Create account
              </LoadingButton>
            </Stack>
          </Box>

          <Stack direction="row" spacing={1} justifyContent="center" mt={4}>
            <Typography variant="body2">Already registered?</Typography>
            <Link component="button" variant="body2" onClick={() => navigate('/login')}>
              Sign in
            </Link>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default Register;

