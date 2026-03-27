import React, { useEffect, useMemo, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Stack,
  Chip,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import api from '../../utils/api';
import PanelLayout from '../Layout/PanelLayout';
import StatCard from '../Common/StatCard';
import { useAuth } from '../../context/AuthContext';
import { Agriculture, Recycling } from '@mui/icons-material';

const CompostPanel = ({ darkMode, setDarkMode }) => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [availableDonations, setAvailableDonations] = useState([]);
  const [myRequests, setMyRequests] = useState([]);

  useEffect(() => {
    if (user && user.userId) {
      loadAvailableDonations();
      loadMyRequests();
    }
  }, [user]);

  const loadAvailableDonations = async () => {
    if (!user || !user.token) return;
    try {
      const response = await api.get('/donations/available/COMPOST');
      setAvailableDonations(response.data || []);
    } catch (err) {
      // Don't show error for 401/403 - might be user not approved yet
      if (err.response?.status !== 401 && err.response?.status !== 403) {
        enqueueSnackbar('Unable to fetch compost-ready batches.', { variant: 'error' });
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
        enqueueSnackbar('Unable to fetch your pickups.', { variant: 'error' });
      }
      setMyRequests([]);
    }
  };

  const handleRequestDonation = async (donationId) => {
    try {
      await api.post(
        `/requests?donationId=${donationId}&requesterId=${user.userId}&requesterType=COMPOST_AGENCY`
      );
      enqueueSnackbar('Pickup booked. Coordinate with the donor for timing.', { variant: 'success' });
      loadAvailableDonations();
      loadMyRequests();
    } catch {
      enqueueSnackbar('Unable to request this batch.', { variant: 'warning' });
    }
  };

  const handleMarkComposted = async (requestId) => {
    try {
      await api.put(`/requests/${requestId}/status?status=COMPOSTED`);
      enqueueSnackbar('Marked as composted. Great work!', { variant: 'success' });
      loadMyRequests();
    } catch {
      enqueueSnackbar('Failed to update compost status.', { variant: 'error' });
    }
  };

  const stats = useMemo(
    () => [
      { label: 'Available batches', value: availableDonations.length, icon: <Agriculture /> },
      { label: 'Completed compost', value: myRequests.filter((r) => r.status === 'COMPOSTED').length, icon: <Recycling /> },
      { label: 'Active pickups', value: myRequests.filter((r) => r.status !== 'COMPOSTED').length },
    ],
    [availableDonations.length, myRequests]
  );

  const statusColor = (status) => {
    switch (status) {
      case 'COMPOSTED':
        return 'success';
      case 'PENDING':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <PanelLayout
      title="Compost & Circularity Hub"
      subtitle="Claim expired batches and close the loop on food waste."
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
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <div>
                <Typography variant="h6">Compost-ready batches</Typography>
                <Typography variant="body2" color="text.secondary">
                  Claim stale or surplus food before it reaches landfill.
                </Typography>
              </div>
              <Button size="small" onClick={loadAvailableDonations}>
                Refresh
              </Button>
            </Stack>
            <Grid container spacing={2}>
              {availableDonations.map((donation) => (
                <Grid item xs={12} key={donation.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6">{donation.foodName}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {donation.description || 'No extra details provided.'}
                      </Typography>
                      <Stack direction="row" spacing={2}>
                        <Chip label={`${donation.quantity} kg equivalent`} size="small" />
                        <Chip label={dayjs(donation.expiryDate).format('MMM DD, HH:mm')} size="small" />
                      </Stack>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'flex-end', px: 3, pb: 2 }}>
                      <Button variant="contained" onClick={() => handleRequestDonation(donation.id)}>
                        Schedule pickup
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
              {availableDonations.length === 0 && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    No compost batches waiting right now. Check back soon.
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <div>
                <Typography variant="h6">My pickups</Typography>
                <Typography variant="body2" color="text.secondary">
                  Update completion to reward eco impact points.
                </Typography>
              </div>
              <Button size="small" onClick={loadMyRequests}>
                Refresh
              </Button>
            </Stack>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Batch</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {myRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <Typography variant="subtitle2">{request.donation?.foodName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {dayjs(request.createdAt).format('MMM DD, HH:mm')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={request.status} size="small" color={statusColor(request.status)} />
                    </TableCell>
                    <TableCell align="right">
                      {request.status !== 'COMPOSTED' && (
                        <Button
                          size="small"
                          color="success"
                          variant="contained"
                          onClick={() => handleMarkComposted(request.id)}
                        >
                          Mark composted
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
    </PanelLayout>
  );
};

export default CompostPanel;

