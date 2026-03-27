import React, { useEffect, useMemo, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Card,
  CardContent,
  CardActions,
  Chip,
  Stack,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Box,
} from '@mui/material';
import { VolunteerActivism, Agriculture, Pets } from '@mui/icons-material';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useSnackbar } from 'notistack';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import api from '../../utils/api';
import PanelLayout from '../Layout/PanelLayout';
import StatCard from '../Common/StatCard';
import { useAuth } from '../../context/AuthContext';

dayjs.extend(relativeTime);

const MapAutoCenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center?.[0] && center?.[1]) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
};

const donationFilters = [
  { value: 'HUMAN', label: 'Human', icon: <VolunteerActivism fontSize="small" /> },
  { value: 'DOG', label: 'Dogs', icon: <Pets fontSize="small" /> },
  { value: 'COMPOST', label: 'Compost', icon: <Agriculture fontSize="small" /> },
];

const NGOPanel = ({ darkMode, setDarkMode }) => {
  const { user } = useAuth();
  const [availableDonations, setAvailableDonations] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [selectedType, setSelectedType] = useState('HUMAN');
  const [selectedTrackingRequest, setSelectedTrackingRequest] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [wsClient, setWsClient] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (user && user.userId && user.token) {
      loadAvailableDonations();
      loadMyRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType, user]);

  useEffect(() => {
    if (user && user.userId && user.token) {
      loadMyRequests();
      const stomp = connectWebSocket();
      return () => stomp?.deactivate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadAvailableDonations = async () => {
    if (!user || !user.token) return;
    try {
      const response = await api.get(`/donations/available/${selectedType}`);
      setAvailableDonations(response.data || []);
    } catch (err) {
      // Don't show error for 401/403 - might be user not approved yet
      if (err.response?.status !== 401 && err.response?.status !== 403) {
        enqueueSnackbar('Unable to fetch donations at the moment.', { variant: 'error' });
      }
      setAvailableDonations([]);
    }
  };

  const loadMyRequests = async () => {
    if (!user || !user.token || !user.userId) return;
    try {
      const response = await api.get(`/requests/requester/${user.userId}`);
      setMyRequests(response.data || []);
    } catch (err) {
      // Don't show error for 401/403 - might be user not approved yet
      if (err.response?.status !== 401 && err.response?.status !== 403) {
        enqueueSnackbar('Unable to load your request history.', { variant: 'error' });
      }
      setMyRequests([]);
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

  const handleTrackRequest = async (request) => {
    setSelectedTrackingRequest(request);
    setTracking(null);
    subscribeToRequestTracking(request.id);
    try {
      const res = await api.get(`/tracking/request/${request.id}/latest`);
      setTracking(res.data);
    } catch {
      // Ignore when no location has been pushed yet
    }
  };

  const handleRequestDonation = async (donationId) => {
    try {
      await api.post(
        `/requests?donationId=${donationId}&requesterId=${user.userId}&requesterType=NGO`
      );
      enqueueSnackbar('Request submitted. A volunteer will be assigned shortly.', { variant: 'success' });
      loadAvailableDonations();
      loadMyRequests();
    } catch (err) {
      enqueueSnackbar('Request failed. This donation may already be assigned.', { variant: 'error' });
    }
  };

  const stats = useMemo(
    () => [
      { label: 'Open requests', value: myRequests.filter((r) => r.status !== 'DELIVERED').length },
      { label: 'Delivered meals', value: myRequests.filter((r) => r.status === 'DELIVERED').length },
      { label: 'Available donations', value: availableDonations.length },
    ],
    [availableDonations.length, myRequests]
  );

  const statusColor = (status) => {
    switch (status) {
      case 'DELIVERED':
        return 'success';
      case 'PENDING':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <PanelLayout
      title="NGO Operations Hub"
      subtitle="Match surplus meals with shelters, missions, and feeding drives."
      darkMode={darkMode}
      setDarkMode={setDarkMode}
    >
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <StatCard label="Open requests" value={stats[0].value} icon={<VolunteerActivism />} />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard label="Delivered meals" value={stats[1].value} icon={<Pets />} color="secondary" />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard label="Available donations" value={stats[2].value} icon={<Agriculture />} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <div>
                <Typography variant="h6">Nearby donations</Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose the food quality that matches your beneficiaries.
                </Typography>
              </div>
              <ToggleButtonGroup
                size="small"
                value={selectedType}
                exclusive
                onChange={(_, value) => value && setSelectedType(value)}
              >
                {donationFilters.map((filter) => (
                  <ToggleButton key={filter.value} value={filter.value}>
                    {filter.icon}
                    <Typography variant="caption" ml={1}>
                      {filter.label}
                    </Typography>
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Stack>

            <Grid container spacing={2}>
              {availableDonations.length === 0 && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    No donations of this type right now. Try another filter or refresh shortly.
                  </Typography>
                </Grid>
              )}
              {availableDonations.map((donation) => (
                <Grid item xs={12} key={donation.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between">
                        <div>
                          <Typography variant="h6">{donation.foodName}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {donation.description || 'No extra details provided.'}
                          </Typography>
                          <Stack direction="row" spacing={2} flexWrap="wrap">
                            <Chip label={`${donation.quantity} meals`} size="small" />
                            <Chip
                              label={`Expires ${dayjs(donation.expiryDate).fromNow()}`}
                              size="small"
                              color="warning"
                            />
                          </Stack>
                        </div>
                        <Typography variant="body2" color="text.secondary">
                          {donation.address}
                        </Typography>
                      </Stack>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'flex-end', px: 3, pb: 2 }}>
                      <Button onClick={() => handleRequestDonation(donation.id)} variant="contained">
                        Request pickup
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 3, height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <div>
                <Typography variant="h6">My request timeline</Typography>
                <Typography variant="body2" color="text.secondary">
                  Track assignment status and volunteer partners.
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
                  <TableCell>Status</TableCell>
                  <TableCell>Volunteer</TableCell>
                  <TableCell align="right">Track</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {myRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <Typography variant="subtitle2">{request.donation?.foodName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Placed {dayjs(request.createdAt).format('MMM DD, HH:mm')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={request.status}
                        size="small"
                        color={statusColor(request.status)}
                      />
                    </TableCell>
                    <TableCell>
                      {request.assignedVolunteer?.fullName || (
                        <Chip label="Awaiting volunteer" size="small" />
                      )}
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
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>

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
    </PanelLayout>
  );
};

export default NGOPanel;

