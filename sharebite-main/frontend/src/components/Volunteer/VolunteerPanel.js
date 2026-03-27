import React, { useState, useEffect, useMemo } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
} from '@mui/material';
import { EmojiEvents, LocalShipping, Navigation } from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import { useSnackbar } from 'notistack';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import PanelLayout from '../Layout/PanelLayout';
import StatCard from '../Common/StatCard';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const mapContainerStyle = { width: '100%', height: 360, borderRadius: 12 };

const MapAutoCenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center?.[0] && center?.[1]) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
};

const VolunteerPanel = ({ darkMode, setDarkMode }) => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [requests, setRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [points, setPoints] = useState(null);
  const [client, setClient] = useState(null);
  const [deliveryDialog, setDeliveryDialog] = useState({
    open: false,
    request: null,
    note: '',
    imageFile: null,
    imagePreview: null,
    uploading: false,
  });

  useEffect(() => {
    if (user && user.userId && user.token) {
      loadRequests();
      loadMyRequests();
      loadPoints();
      const stomp = connectWebSocket();
      return () => {
        stomp?.deactivate();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const connectWebSocket = () => {
    const stomp = new Client({
      reconnectDelay: 5000,
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
    });
    stomp.onConnect = () => setClient(stomp);
    stomp.activate();
    return stomp;
  };

  const subscribeToRequest = (requestId) => {
    if (!client) return;
    client.subscribe(`/topic/tracking/${requestId}`, (message) => {
      const data = JSON.parse(message.body);
      setTracking(data);
    });
  };

  const loadRequests = async () => {
    if (!user || !user.token) return;
    try {
      const response = await api.get('/requests');
      setRequests((response.data || []).filter((r) => r.status === 'PENDING' || r.status === 'ACCEPTED'));
    } catch (err) {
      console.error('Error loading requests:', err);
      // Don't show error for 401/403 - might be user not approved yet
      if (err.response?.status !== 401 && err.response?.status !== 403) {
        const errorMessage = err.response?.data?.message || 'Unable to load open pickups.';
        enqueueSnackbar(errorMessage, { variant: 'error' });
      }
      setRequests([]);
    }
  };

  const loadMyRequests = async () => {
    if (!user || !user.token || !user.userId) return;
    try {
      const response = await api.get(`/requests/volunteer/${user.userId}`);
      setMyRequests(response.data || []);
    } catch (err) {
      console.error('Error loading my requests:', err);
      // Don't show error for 401/403 - might be user not approved yet
      if (err.response?.status !== 401 && err.response?.status !== 403) {
        const errorMessage = err.response?.data?.message || 'Unable to load your deliveries.';
        enqueueSnackbar(errorMessage, { variant: 'error' });
      }
      setMyRequests([]);
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

  const handleAcceptRequest = async (requestId) => {
    try {
      await api.put(`/requests/${requestId}/assign?volunteerId=${user.userId}`);
      enqueueSnackbar('Pickup assigned to you. Check your route details.', { variant: 'success' });
      loadRequests();
      loadMyRequests();
    } catch {
      enqueueSnackbar('Claim failed, someone else might have accepted it.', { variant: 'warning' });
    }
  };

  const handleStartTracking = (request) => {
    setSelectedRequest(request);
    subscribeToRequest(request.id);
  };

  const updateLocation = async (req) => {
    if (!req || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        await api.post('/tracking', null, {
          params: {
            requestId: req.id,
            volunteerId: user.userId,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        });
      } catch {
        enqueueSnackbar('Unable to push live location.', { variant: 'error' });
      }
    });
  };

  useEffect(() => {
    let timer;
    if (selectedRequest) {
      updateLocation(selectedRequest);
      timer = setInterval(() => updateLocation(selectedRequest), 5000);
    }
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRequest]);

  const handleOpenDeliveredDialog = (request) => {
    setDeliveryDialog({
      open: true,
      request,
      note: '',
      imageFile: null,
      imagePreview: null,
      uploading: false,
    });
  };

  const handleProofFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      enqueueSnackbar('Please select a valid image file for delivery proof.', { variant: 'warning' });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setDeliveryDialog((prev) => ({ ...prev, imagePreview: reader.result, imageFile: file }));
    };
    reader.readAsDataURL(file);
  };

  const uploadProofImage = async (file) => {
    const payload = new FormData();
    payload.append('file', file);
    const response = await api.post('/files/upload', payload);
    const url = response.data?.url;
    return url?.startsWith('http') ? url : `http://localhost:8080${url}`;
  };

  const handleConfirmDelivered = async () => {
    const request = deliveryDialog.request;
    if (!request) return;
    if (!deliveryDialog.imageFile) {
      enqueueSnackbar('Delivery proof image is required.', { variant: 'warning' });
      return;
    }

    setDeliveryDialog((prev) => ({ ...prev, uploading: true }));
    try {
      const proofUrl = await uploadProofImage(deliveryDialog.imageFile);
      await api.put(`/requests/${request.id}/status`, null, {
        params: {
          status: 'DELIVERED',
          deliveryProofUrl: proofUrl,
          deliveryProofNote: deliveryDialog.note || null,
        },
      });
      enqueueSnackbar('Delivery confirmed. Thank you!', { variant: 'success' });
      loadMyRequests();
      setSelectedRequest(null);
      setTracking(null);
      setDeliveryDialog({
        open: false,
        request: null,
        note: '',
        imageFile: null,
        imagePreview: null,
        uploading: false,
      });
    } catch {
      enqueueSnackbar('Could not mark as delivered.', { variant: 'error' });
    } finally {
      setDeliveryDialog((prev) => ({ ...prev, uploading: false }));
    }
  };

  const stats = useMemo(
    () => [
      { label: 'Open pickups', value: requests.length, icon: <Navigation /> },
      { label: 'My assignments', value: myRequests.filter((r) => r.status !== 'DELIVERED').length, icon: <LocalShipping /> },
      { label: 'Points', value: points?.totalPoints ?? 0, icon: <EmojiEvents />, color: 'secondary' },
    ],
    [requests.length, myRequests, points]
  );

  return (
    <PanelLayout
      title="Volunteer Live Ops"
      subtitle="Claim pickups, stream your GPS, and close deliveries in real-time."
      darkMode={darkMode}
      setDarkMode={setDarkMode}
    >
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {stats.map((item) => (
          <Grid item xs={12} md={4} key={item.label}>
            <StatCard {...item} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <div>
                <Typography variant="h6">Available pickups</Typography>
                <Typography variant="body2" color="text.secondary">
                  Accept a request to lock it and begin navigation.
                </Typography>
              </div>
              <Button size="small" onClick={loadRequests}>
                Refresh
              </Button>
            </Stack>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Meal</TableCell>
                  <TableCell>Pickup address</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.donation?.foodName}</TableCell>
                    <TableCell>{request.pickupAddress || request.donation?.address}</TableCell>
                    <TableCell>
                      <Chip label={request.status} size="small" color="warning" />
                    </TableCell>
                    <TableCell align="right">
                      {!request.assignedVolunteer && (
                        <Button size="small" variant="contained" onClick={() => handleAcceptRequest(request.id)}>
                          Accept
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <div>
                <Typography variant="h6">My active deliveries</Typography>
                <Typography variant="body2" color="text.secondary">
                  Tap track to broadcast your live location.
                </Typography>
              </div>
              <Button size="small" onClick={loadMyRequests}>
                Refresh
              </Button>
            </Stack>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Meal</TableCell>
                  <TableCell>Drop location</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {myRequests
                  .filter((r) => r.status !== 'DELIVERED')
                  .map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{request.donation?.foodName}</TableCell>
                      <TableCell>{request.deliveryAddress}</TableCell>
                      <TableCell>
                        <Chip label={request.status} size="small" color="info" />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button size="small" onClick={() => handleStartTracking(request)}>
                            Track
                          </Button>
                          <Button
                            size="small"
                            color="success"
                            variant="contained"
                            onClick={() => handleOpenDeliveredDialog(request)}
                          >
                            Delivered
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>

      {selectedRequest && (
        <Paper elevation={0} sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" mb={2}>
            Live tracking — {selectedRequest.donation?.foodName}
          </Typography>
          <MapContainer
            center={
              tracking
                ? [tracking.latitude, tracking.longitude]
                : [selectedRequest.donation?.latitude || 20.5937, selectedRequest.donation?.longitude || 78.9629]
            }
            zoom={14}
            style={mapContainerStyle}
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
            {selectedRequest.donation?.latitude && selectedRequest.donation?.longitude && (
              <Marker position={[selectedRequest.donation.latitude, selectedRequest.donation.longitude]}>
                <Popup>Pickup point</Popup>
              </Marker>
            )}
            {tracking &&
              selectedRequest.donation?.latitude &&
              selectedRequest.donation?.longitude && (
                <Polyline
                  positions={[
                    [tracking.latitude, tracking.longitude],
                    [selectedRequest.donation.latitude, selectedRequest.donation.longitude],
                  ]}
                  pathOptions={{ color: '#1976d2', weight: 4 }}
                />
              )}
            <MapAutoCenter center={tracking ? [tracking.latitude, tracking.longitude] : null} />
          </MapContainer>
        </Paper>
      )}

      <Dialog
        open={deliveryDialog.open}
        onClose={() => !deliveryDialog.uploading && setDeliveryDialog((prev) => ({ ...prev, open: false }))}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm delivery with proof</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            <TextField
              type="file"
              inputProps={{ accept: 'image/*' }}
              onChange={handleProofFileChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Delivery note (optional)"
              multiline
              minRows={3}
              value={deliveryDialog.note}
              onChange={(e) => setDeliveryDialog((prev) => ({ ...prev, note: e.target.value }))}
              placeholder="Receiver name, landmark, or handover details..."
              fullWidth
            />
            {deliveryDialog.imagePreview && (
              <Box
                component="img"
                src={deliveryDialog.imagePreview}
                alt="Delivery proof preview"
                sx={{ width: '100%', maxHeight: 260, objectFit: 'cover', borderRadius: 1 }}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeliveryDialog((prev) => ({ ...prev, open: false }))} disabled={deliveryDialog.uploading}>
            Cancel
          </Button>
          <Button variant="contained" color="success" onClick={handleConfirmDelivered} disabled={deliveryDialog.uploading}>
            Confirm Delivered
          </Button>
        </DialogActions>
      </Dialog>
    </PanelLayout>
  );
};

export default VolunteerPanel;

