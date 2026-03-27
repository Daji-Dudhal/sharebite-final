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
  Box,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { Star, StarBorder } from '@mui/icons-material';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import api from '../../utils/api';
import PanelLayout from '../Layout/PanelLayout';
import StatCard from '../Common/StatCard';
import { useAuth } from '../../context/AuthContext';

const NeedyPanel = ({ darkMode, setDarkMode }) => {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [availableDonations, setAvailableDonations] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [freshnessRatings, setFreshnessRatings] = useState({});
  const [ratingDialog, setRatingDialog] = useState({ open: false, donationId: null, rating: 3, comment: '' });

  useEffect(() => {
    if (user && user.userId) {
      loadAvailableDonations();
      loadMyRequests();
    }
  }, [user]);

  useEffect(() => {
    // Load freshness ratings for all donations
    availableDonations.forEach(donation => {
      loadFreshnessRating(donation.id);
    });
  }, [availableDonations]);

  const loadAvailableDonations = async () => {
    try {
      const response = await api.get('/donations/available/HUMAN');
      setAvailableDonations(response.data || []);
    } catch (err) {
      console.error('Error loading donations:', err);
      const errorMessage = err.response?.data?.message || 'Unable to fetch meals near you.';
      enqueueSnackbar(errorMessage, { variant: 'error' });
      setAvailableDonations([]);
    }
  };

  const loadMyRequests = async () => {
    try {
      const response = await api.get(`/requests/requester/${user?.userId}`);
      setMyRequests(response.data || []);
    } catch (err) {
      console.error('Error loading requests:', err);
      const errorMessage = err.response?.data?.message || 'Unable to load your requests.';
      enqueueSnackbar(errorMessage, { variant: 'error' });
      setMyRequests([]);
    }
  };

  const loadFreshnessRating = async (donationId) => {
    try {
      const response = await api.get(`/freshness/donation/${donationId}/summary`);
      setFreshnessRatings(prev => ({
        ...prev,
        [donationId]: response.data
      }));
    } catch (err) {
      console.error('Error loading freshness rating:', err);
      // Don't show error, just leave it empty
    }
  };

  const handleRateFreshness = (donationId) => {
    setRatingDialog({ open: true, donationId, rating: 3, comment: '' });
  };

  const handleSubmitRating = async () => {
    try {
      await api.post('/freshness', null, {
        params: {
          donationId: ratingDialog.donationId,
          userId: user?.userId,
          rating: ratingDialog.rating,
          comment: ratingDialog.comment || null,
        }
      });
      enqueueSnackbar('Thank you for rating the freshness!', { variant: 'success' });
      loadFreshnessRating(ratingDialog.donationId);
      setRatingDialog({ open: false, donationId: null, rating: 3, comment: '' });
    } catch (err) {
      console.error('Error rating freshness:', err);
      const errorMessage = err.response?.data?.message || 'Failed to submit rating.';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  };

  const handleRequestDonation = async (donationId) => {
    try {
      await api.post(
        `/requests?donationId=${donationId}&requesterId=${user.userId}&requesterType=NEEDY`
      );
      enqueueSnackbar('Request recorded. A volunteer will contact you.', { variant: 'success' });
      loadAvailableDonations();
      loadMyRequests();
    } catch {
      enqueueSnackbar('Sorry, this donation may already be taken.', { variant: 'warning' });
    }
  };

  const stats = useMemo(
    () => [
      { label: 'Open requests', value: myRequests.filter((r) => r.status !== 'DELIVERED').length },
      { label: 'Delivered meals', value: myRequests.filter((r) => r.status === 'DELIVERED').length },
      { label: 'Meals nearby', value: availableDonations.length },
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

  const getImageUrl = (photoUrl) => {
    if (!photoUrl) return null;
    if (photoUrl.startsWith('http')) return photoUrl;
    return `http://localhost:8080${photoUrl}`;
  };

  return (
    <PanelLayout
      title="Meal Request Center"
      subtitle="Find verified donations and follow your delivery status."
      darkMode={darkMode}
      setDarkMode={setDarkMode}
    >
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <StatCard label="Open requests" value={stats[0].value} icon={<Chip label="Open" />} />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard label="Delivered meals" value={stats[1].value} icon={<Chip label="Done" />} />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatCard label="Meals nearby" value={stats[2].value} icon={<Chip label="Available" />} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <div>
                <Typography variant="h6">Available meals</Typography>
                <Typography variant="body2" color="text.secondary">
                  Tap request to reserve a pickup. Volunteers will handle delivery.
                </Typography>
              </div>
              <Button size="small" onClick={loadAvailableDonations}>
                Refresh
              </Button>
            </Stack>
            <Grid container spacing={2}>
              {availableDonations.map((donation) => {
                const freshness = freshnessRatings[donation.id];
                const imageUrl = getImageUrl(donation.photoUrl);
                return (
                  <Grid item xs={12} key={donation.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Grid container spacing={2}>
                          {imageUrl && (
                            <Grid item xs={12} sm={4}>
                              <Box
                                component="img"
                                src={imageUrl}
                                alt={donation.foodName}
                                sx={{
                                  width: '100%',
                                  height: '150px',
                                  objectFit: 'cover',
                                  borderRadius: 1,
                                }}
                              />
                            </Grid>
                          )}
                          <Grid item xs={12} sm={imageUrl ? 8 : 12}>
                            <Typography variant="h6">{donation.foodName}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {donation.description || 'No extra details provided.'}
                            </Typography>
                            <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 1 }}>
                              <Chip label={`${donation.quantity} meals`} size="small" />
                              <Chip
                                label={`Expires ${dayjs(donation.expiryDate).format('MMM DD, HH:mm')}`}
                                size="small"
                                color="warning"
                              />
                            </Stack>
                            {freshness && freshness.totalRatings > 0 && (
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                                <Rating
                                  value={freshness.averageRating}
                                  readOnly
                                  size="small"
                                  precision={0.1}
                                />
                                <Typography variant="caption" color="text.secondary">
                                  {freshness.averageRating.toFixed(1)} ({freshness.totalRatings} ratings)
                                </Typography>
                              </Stack>
                            )}
                          </Grid>
                        </Grid>
                      </CardContent>
                      <CardActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
                        <Button
                          size="small"
                          onClick={() => handleRateFreshness(donation.id)}
                          disabled={!imageUrl}
                        >
                          Rate Freshness
                        </Button>
                        <Button variant="contained" onClick={() => handleRequestDonation(donation.id)}>
                          Request this meal
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
              {availableDonations.length === 0 && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    No meals available right now. Please try again soon.
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
                <Typography variant="h6">My requests</Typography>
                <Typography variant="body2" color="text.secondary">
                  Watch the status and assigned volunteer for each meal.
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
                    <TableCell>
                      {request.assignedVolunteer?.fullName || (
                        <Chip label="Pending assignment" size="small" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={ratingDialog.open} onClose={() => setRatingDialog({ ...ratingDialog, open: false })}>
        <DialogTitle>Rate Food Freshness</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1, minWidth: 300 }}>
            <Typography variant="body2" color="text.secondary">
              Based on the uploaded image, how fresh does the food look?
            </Typography>
            <Rating
              value={ratingDialog.rating}
              onChange={(event, newValue) => {
                setRatingDialog({ ...ratingDialog, rating: newValue || 3 });
              }}
              size="large"
              icon={<Star fontSize="inherit" />}
              emptyIcon={<StarBorder fontSize="inherit" />}
            />
            <TextField
              label="Comment (optional)"
              multiline
              rows={3}
              value={ratingDialog.comment}
              onChange={(e) => setRatingDialog({ ...ratingDialog, comment: e.target.value })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRatingDialog({ ...ratingDialog, open: false })}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSubmitRating}>
            Submit Rating
          </Button>
        </DialogActions>
      </Dialog>
    </PanelLayout>
  );
};

export default NeedyPanel;

