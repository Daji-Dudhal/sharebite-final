import React, { useEffect, useState, useMemo } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Chip,
  Stack,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Box,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { AddRounded, Inventory2Rounded, EmojiEvents, MapRounded } from '@mui/icons-material';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import PanelLayout from '../Layout/PanelLayout';
import StatCard from '../Common/StatCard';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const donationTypes = [
  { value: 'HUMAN', label: 'Human Consumption' },
  { value: 'DOG', label: 'Stray Dogs' },
  { value: 'COMPOST', label: 'Compost' },
];

const MapAutoCenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center?.[0] && center?.[1]) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
};

const HotelPanel = ({ darkMode, setDarkMode }) => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [points, setPoints] = useState(null);
  const [donationRequests, setDonationRequests] = useState([]);
  const [selectedTrackingRequest, setSelectedTrackingRequest] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [wsClient, setWsClient] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const [formData, setFormData] = useState({
    foodName: '',
    description: '',
    quantity: '',
    expiryDate: '',
    donationType: 'HUMAN',
    address: '',
    latitude: '',
    longitude: '',
    photoUrl: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (user && user.userId && user.token) {
      refreshData();
      const stomp = connectWebSocket();
      return () => stomp?.deactivate();
    }
  }, [user]);

  const refreshData = () => {
    loadDonations();
    loadPoints();
    loadDonationRequests();
  };

  const loadDonations = async () => {
    if (!user || !user.token || !user.userId) return;
    try {
      const response = await api.get(`/donations/donor/${user.userId}`);
      setDonations(response.data || []);
    } catch (err) {
      console.error('Error loading donations:', err);
      // Don't show error for 401/403 - might be user not approved yet
      if (err.response?.status !== 401 && err.response?.status !== 403) {
        const errorMessage = err.response?.data?.message || 'Unable to fetch donations.';
        enqueueSnackbar(errorMessage, { variant: 'error' });
      }
      setDonations([]);
    }
  };

  const loadPoints = async () => {
    try {
      const response = await api.get(`/gamification/points/${user?.userId}`);
      setPoints(response.data);
    } catch (err) {
      console.error('Error loading points:', err);
      // Don't show error for points, just leave it empty
      setPoints(null);
    }
  };

  const connectWebSocket = () => {
    const stomp = new Client({
      reconnectDelay: 5000,
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
    });
    stomp.onConnect = () => setWsClient(stomp);
    stomp.activate();
    return stomp;
  };

  const subscribeToRequestTracking = (requestId) => {
    if (!wsClient) return;
    wsClient.subscribe(`/topic/tracking/${requestId}`, (message) => {
      const data = JSON.parse(message.body);
      setTracking(data);
    });
  };

  const loadDonationRequests = async () => {
    if (!user?.userId) return;
    try {
      const response = await api.get(`/requests/donor/${user.userId}`);
      setDonationRequests(response.data || []);
    } catch (err) {
      if (err.response?.status !== 401 && err.response?.status !== 403) {
        enqueueSnackbar('Unable to load pickup requests for your donations.', { variant: 'error' });
      }
      setDonationRequests([]);
    }
  };

  const handleTrackRequest = async (request) => {
    setSelectedTrackingRequest(request);
    setTracking(null);
    subscribeToRequestTracking(request.id);
    try {
      const res = await api.get(`/tracking/request/${request.id}/latest`);
      setTracking(res.data);
    } catch {
      // no live point available yet
    }
  };

  const handleFormChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        enqueueSnackbar('Please select an image file', { variant: 'error' });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;
    
    // Verify user is authenticated - always check localStorage directly
    const token = localStorage.getItem('token');
    if (!token) {
      enqueueSnackbar('You must be logged in to upload images.', { variant: 'error' });
      return null;
    }
    
    if (!user || !user.userId) {
      enqueueSnackbar('User information is missing. Please log in again.', { variant: 'error' });
      return null;
    }
    
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      
      // Double-check token is still valid before upload
      const freshToken = localStorage.getItem('token');
      if (!freshToken) {
        enqueueSnackbar('Your session has expired. Please log in again.', { variant: 'error' });
        setUploadingImage(false);
        return null;
      }
      
      // Make the upload request
      // The interceptor will:
      // 1. Get token from localStorage
      // 2. Set Authorization header
      // 3. Remove Content-Type to let browser set it with boundary
      const response = await api.post('/files/upload', formData);
      
      return response.data.url;
    } catch (err) {
      console.error('Error uploading image:', err);
      console.error('Response status:', err.response?.status);
      console.error('Response data:', err.response?.data);
      console.error('Request config:', {
        url: err.config?.url,
        method: err.config?.method,
        hasAuthHeader: !!err.config?.headers?.Authorization,
        authHeader: err.config?.headers?.Authorization ? err.config.headers.Authorization.substring(0, 30) + '...' : 'none',
        isFormData: err.config?.data instanceof FormData
      });
      
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to upload image. Please try again.';
      
      // Handle different error types
      if (err.response?.status === 401 || err.response?.status === 403) {
        // Check if it's really an auth error or just permission issue
        const errorData = err.response?.data;
        const errorMsg = (errorData?.message || '').toLowerCase();
        if (errorMsg.includes('token') || errorMsg.includes('expired') || errorMsg.includes('invalid') || errorMsg.includes('authentication') || errorMsg.includes('unauthorized')) {
          enqueueSnackbar('Your session has expired. Please log in again.', { variant: 'error' });
        } else {
          enqueueSnackbar('Unable to upload. Please ensure your account is approved.', { variant: 'warning' });
        }
      } else if (err.response?.status === 500) {
        enqueueSnackbar('Server error occurred. Please try again later.', { variant: 'error' });
      } else {
        enqueueSnackbar(errorMessage, { variant: 'error' });
      }
      
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateDonation = async (e) => {
    e.preventDefault();
    
    // Verify user is authenticated
    if (!user || !user.userId) {
      enqueueSnackbar('You must be logged in to create donations.', { variant: 'error' });
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      enqueueSnackbar('Your session has expired. Please log in again.', { variant: 'error' });
      return;
    }
    
    setSubmitting(true);
    try {
      // Upload image first if present
      let photoUrl = formData.photoUrl;
      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (!uploadedUrl) {
          setSubmitting(false);
          return;
        }
        // Ensure full URL is stored
        photoUrl = uploadedUrl.startsWith('http') ? uploadedUrl : `http://localhost:8080${uploadedUrl}`;
      }

      console.log('Creating donation with userId:', user.userId);
      console.log('Token present:', !!localStorage.getItem('token'));
      
      const donationData = {
        ...formData,
        photoUrl: photoUrl || null,
        quantity: parseInt(formData.quantity, 10),
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      };
      
      console.log('Donation data:', donationData);
      
      const response = await api.post(`/donations?donorId=${user.userId}`, donationData);
      console.log('Donation created successfully:', response.data);
      
      enqueueSnackbar('Donation published successfully!', { variant: 'success' });
      setFormData({
        foodName: '',
        description: '',
        quantity: '',
        expiryDate: '',
        donationType: 'HUMAN',
        address: '',
        latitude: '',
        longitude: '',
        photoUrl: '',
      });
      setImageFile(null);
      setImagePreview(null);
      setOpenForm(false);
      refreshData();
    } catch (err) {
      console.error('Error creating donation:', err);
      console.error('Response status:', err.response?.status);
      console.error('Response data:', err.response?.data);
      console.error('Request config:', err.config);
      
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          'Failed to publish donation. Please review the form.';
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        enqueueSnackbar('Authentication failed. Your session may have expired. Please log in again.', { variant: 'error' });
      } else {
        enqueueSnackbar(errorMessage, { variant: 'error' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const statItems = useMemo(
    () => [
      {
        label: 'Total donations',
        value: donations.length,
        icon: <Inventory2Rounded />,
        color: 'primary',
      },
      {
        label: 'Total points',
        value: points?.totalPoints ?? 0,
        icon: <EmojiEvents />,
        color: 'secondary',
      },
      {
        label: 'Level',
        value: points?.level ?? 1,
        icon: <MapRounded />,
        color: 'primary',
      },
    ],
    [donations.length, points]
  );

  const statusColor = (status) => {
    switch (status) {
      case 'DELIVERED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'EXPIRED':
      case 'REJECTED':
        return 'error';
      default:
        return 'info';
    }
  };

  return (
    <PanelLayout
      title="Donor Command Center"
      subtitle="List surplus meals, track pickups, and grow your impact score."
      actions={
        <Button
          variant="contained"
          startIcon={<AddRounded />}
          onClick={() => setOpenForm(true)}
        >
          Publish donation
        </Button>
      }
      darkMode={darkMode}
      setDarkMode={setDarkMode}
    >
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statItems.map((item) => (
          <Grid item xs={12} md={4} key={item.label}>
            <StatCard {...item} />
          </Grid>
        ))}
      </Grid>

      <Paper elevation={0} sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <div>
            <Typography variant="h6">Donation history</Typography>
            <Typography variant="body2" color="text.secondary">
              Track fulfilment, expiries, and compost pickups.
            </Typography>
          </div>
          <Button size="small" onClick={refreshData}>
            Refresh
          </Button>
        </Stack>
        <Table size="medium">
          <TableHead>
            <TableRow>
              <TableCell>Food</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Expiry</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {donations.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography variant="body2" align="center" color="text.secondary">
                    No donations yet. Share your first batch today!
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {donations.map((donation) => (
              <TableRow key={donation.id}>
                <TableCell>
                  <Stack direction="row" spacing={2}>
                    {donation.photoUrl && (
                      <Box
                        component="img"
                        src={donation.photoUrl.startsWith('http') ? donation.photoUrl : `http://localhost:8080${donation.photoUrl}`}
                        alt={donation.foodName}
                        sx={{
                          width: 60,
                          height: 60,
                          objectFit: 'cover',
                          borderRadius: 1,
                        }}
                      />
                    )}
                    <Box>
                      <Typography variant="subtitle2">{donation.foodName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {donation.description || '—'}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip label={donation.donationType} size="small" />
                </TableCell>
                <TableCell>{donation.quantity}</TableCell>
                <TableCell>{dayjs(donation.expiryDate).format('MMM DD, YYYY HH:mm')}</TableCell>
                <TableCell>
                  <Chip
                    label={donation.status}
                    size="small"
                    color={statusColor(donation.status)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Paper elevation={0} sx={{ p: 3, mt: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <div>
            <Typography variant="h6">Live request tracking</Typography>
            <Typography variant="body2" color="text.secondary">
              Follow volunteer movement and verify delivery proof for your donations.
            </Typography>
          </div>
          <Button size="small" onClick={loadDonationRequests}>
            Refresh
          </Button>
        </Stack>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Meal</TableCell>
              <TableCell>Requester</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Track</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {donationRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>{request.donation?.foodName}</TableCell>
                <TableCell>{request.requester?.fullName || request.requesterType}</TableCell>
                <TableCell>
                  <Chip label={request.status} size="small" color={statusColor(request.status)} />
                </TableCell>
                <TableCell align="right">
                  {request.assignedVolunteer && (
                    <Button size="small" onClick={() => handleTrackRequest(request)}>
                      {request.status === 'DELIVERED' ? 'Proof' : 'Live'}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {donationRequests.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography variant="body2" color="text.secondary" align="center">
                    No pickup requests yet for your donations.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {selectedTrackingRequest && (
        <Paper elevation={0} sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" mb={2}>
            Live volunteer tracking - {selectedTrackingRequest.donation?.foodName}
          </Typography>
          <MapContainer
            center={
              tracking
                ? [tracking.latitude, tracking.longitude]
                : [selectedTrackingRequest.donation?.latitude || 20.5937, selectedTrackingRequest.donation?.longitude || 78.9629]
            }
            zoom={13}
            style={{ width: '100%', height: 320, borderRadius: 12 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {tracking && (
              <Marker position={[tracking.latitude, tracking.longitude]}>
                <Popup>Volunteer live location</Popup>
              </Marker>
            )}
            <MapAutoCenter center={tracking ? [tracking.latitude, tracking.longitude] : null} />
          </MapContainer>
          {selectedTrackingRequest.status === 'DELIVERED' && selectedTrackingRequest.deliveryProofUrl && (
            <Stack spacing={1} mt={2}>
              <Typography variant="subtitle2">Delivery proof</Typography>
              <Box
                component="img"
                src={selectedTrackingRequest.deliveryProofUrl}
                alt="Delivery proof"
                sx={{ width: 260, maxWidth: '100%', borderRadius: 1 }}
              />
              {selectedTrackingRequest.deliveryProofNote && (
                <Typography variant="body2" color="text.secondary">
                  {selectedTrackingRequest.deliveryProofNote}
                </Typography>
              )}
            </Stack>
          )}
        </Paper>
      )}

      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="md" fullWidth>
        <DialogTitle>Publish new donation</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Food name"
              value={formData.foodName}
              onChange={handleFormChange('foodName')}
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={handleFormChange('description')}
              multiline
              minRows={2}
              fullWidth
            />
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Quantity (meals)"
                  type="number"
                  value={formData.quantity}
                  onChange={handleFormChange('quantity')}
                  required
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Expiry date"
                  type="datetime-local"
                  value={formData.expiryDate}
                  onChange={handleFormChange('expiryDate')}
                  required
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  label="Donation type"
                  value={formData.donationType}
                  onChange={handleFormChange('donationType')}
                  fullWidth
                >
                  {donationTypes.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
            <TextField
              label="Pickup address"
              value={formData.address}
              onChange={handleFormChange('address')}
              multiline
              minRows={2}
              fullWidth
            />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Latitude"
                  type="number"
                  value={formData.latitude}
                  onChange={handleFormChange('latitude')}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Longitude"
                  type="number"
                  value={formData.longitude}
                  onChange={handleFormChange('longitude')}
                  fullWidth
                />
              </Grid>
            </Grid>
            <TextField
              label="Food Image"
              type="file"
              inputProps={{ accept: 'image/*' }}
              onChange={handleImageChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            {imagePreview && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
                />
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenForm(false)} color="inherit">
            Cancel
          </Button>
          <LoadingButton
            variant="contained"
            loading={submitting}
            onClick={handleCreateDonation}
          >
            Publish donation
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </PanelLayout>
  );
};

export default HotelPanel;

