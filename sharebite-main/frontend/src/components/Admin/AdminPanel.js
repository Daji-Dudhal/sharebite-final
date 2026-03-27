import React, { useState, useEffect, useMemo } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Divider,
  Button,
} from '@mui/material';
import {
  CheckCircle,
  HighlightOff,
  Refresh,
  PeopleAltRounded,
  VolunteerActivismRounded,
  AssignmentRounded,
  HourglassTopRounded,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../../utils/api';
import PanelLayout from '../Layout/PanelLayout';
import StatCard from '../Common/StatCard';
import { useAuth } from '../../context/AuthContext';

const AdminPanel = ({ darkMode, setDarkMode }) => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDonations: 0,
    totalRequests: 0,
    pendingApprovals: 0,
  });
  const [loading, setLoading] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();

  useEffect(() => {
    // Only load data if user is authenticated
    if (user && user.token) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, pendingRes, donationsRes, requestsRes] = await Promise.all([
        api.get('/users'),
        api.get('/users/pending'),
        api.get('/donations'),
        api.get('/requests'),
      ]);

      setAllUsers(usersRes.data || []);
      setPendingUsers(pendingRes.data || []);
      setStats({
        totalUsers: usersRes.data?.length || 0,
        totalDonations: donationsRes.data?.length || 0,
        totalRequests: requestsRes.data?.length || 0,
        pendingApprovals: pendingRes.data?.length || 0,
      });
    } catch (err) {
      console.error('Error loading admin data:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          'Unable to load admin data. Please check your connection and try again.';
      enqueueSnackbar(errorMessage, { variant: 'error' });
      
      // Set empty arrays on error to prevent UI issues
      setAllUsers([]);
      setPendingUsers([]);
      setStats({
        totalUsers: 0,
        totalDonations: 0,
        totalRequests: 0,
        pendingApprovals: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId, status) => {
    if (!userId || !status) {
      enqueueSnackbar('Invalid user ID or status. Please refresh the page.', { variant: 'error' });
      return;
    }

    setUpdatingUserId(userId);
    try {
      console.log(`Updating user ${userId} status to ${status}`);
      const url = `/users/${userId}/status?status=${status}`;
      console.log('API URL:', url);
      
      const response = await api.put(url);
      console.log('Update response:', response.data);
      
      const successMessage = status === 'APPROVED' 
        ? 'User approved successfully! They can now log in.' 
        : `User ${status.toLowerCase()} successfully.`;
      enqueueSnackbar(successMessage, { variant: 'success' });
      
      // Update local state immediately for better UX
      if (status === 'APPROVED' || status === 'REJECTED') {
        setPendingUsers(prev => prev.filter(u => u.id !== userId));
        setAllUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, status: status } : u
        ));
        setStats(prev => ({
          ...prev,
          pendingApprovals: Math.max(0, prev.pendingApprovals - 1)
        }));
      }
      
      // Reload data to ensure consistency
      await loadData();
    } catch (err) {
      console.error('Error updating user status:', err);
      console.error('Error response:', err.response);
      console.error('Error response data:', err.response?.data);
      console.error('Error response status:', err.response?.status);
      
      const errorData = err.response?.data;
      let errorMessage = 'Failed to update user status. Please try again.';
      
      if (err.response?.status === 500) {
        errorMessage = 'Server error occurred. Please ensure the backend server is running and try again.';
        if (errorData?.message) {
          errorMessage += ` Details: ${errorData.message}`;
        }
      } else if (errorData) {
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error === 'USER_NOT_FOUND') {
          errorMessage = 'User not found. It may have been deleted.';
        } else if (errorData.error === 'INVALID_STATUS') {
          errorMessage = 'Invalid status value. Please refresh and try again.';
        } else if (errorData.error === 'DATABASE_ERROR') {
          errorMessage = 'Database connection error. Please try again later.';
        } else if (errorData.error) {
          errorMessage = `Error: ${errorData.error}`;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const statItems = useMemo(
    () => [
      { label: 'Total Users', value: stats.totalUsers, icon: <PeopleAltRounded />, color: 'primary' },
      {
        label: 'Donations Posted',
        value: stats.totalDonations,
        icon: <VolunteerActivismRounded />,
        color: 'secondary',
      },
      { label: 'Requests Created', value: stats.totalRequests, icon: <AssignmentRounded />, color: 'primary' },
      { label: 'Pending Approvals', value: stats.pendingApprovals, icon: <HourglassTopRounded />, color: 'secondary' },
    ],
    [stats]
  );

  return (
    <PanelLayout
      title="Admin Command Center"
      subtitle="Manage user registrations, monitor system activity, and drive impact."
      actions={
        <Button
          startIcon={<Refresh />}
          variant="outlined"
          size="small"
          onClick={loadData}
          disabled={loading}
          sx={{ fontFamily: 'Poppins' }}
        >
          Refresh data
        </Button>
      }
      darkMode={darkMode}
      setDarkMode={setDarkMode}
    >
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statItems.map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item.label}>
            <StatCard {...item} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              height: '100%',
              backgroundColor: 'background.paper',
              border: (theme) => `1px solid ${theme.palette.divider}`,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: darkMode ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.12)',
              }
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <div>
                <Typography variant="h6" sx={{ fontFamily: 'Poppins', fontWeight: 600 }}>
                  Pending Approvals
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Poppins' }}>
                  Review accounts awaiting manual verification
                </Typography>
              </div>
              <Chip 
                label={`${pendingUsers.length} waiting`} 
                color="warning" 
                sx={{ fontFamily: 'Poppins', fontWeight: 600 }}
              />
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontFamily: 'Poppins', fontWeight: 600 }}>User</TableCell>
                  <TableCell sx={{ fontFamily: 'Poppins', fontWeight: 600 }}>Role</TableCell>
                  <TableCell align="right" sx={{ fontFamily: 'Poppins', fontWeight: 600 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && pendingUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <Typography variant="body2" color="text.secondary" align="center" sx={{ fontFamily: 'Poppins' }}>
                        Loading pending users...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : pendingUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <Typography variant="body2" color="text.secondary" align="center" sx={{ fontFamily: 'Poppins' }}>
                        All caught up! No pending requests.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingUsers.map((account) => (
                    <TableRow 
                      key={account.id}
                      sx={{ 
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        }
                      }}
                    >
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                          {account.fullName || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Poppins' }}>
                          {account.email || 'No email'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          size="small" 
                          label={account.userType} 
                          sx={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Approve User">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleStatusChange(account.id, 'APPROVED')}
                              disabled={updatingUserId === account.id}
                              sx={{
                                '&:hover': {
                                  backgroundColor: 'success.light',
                                  color: 'success.contrastText',
                                },
                                transition: 'all 0.2s'
                              }}
                            >
                              <CheckCircle fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject User">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleStatusChange(account.id, 'REJECTED')}
                              disabled={updatingUserId === account.id}
                              sx={{
                                '&:hover': {
                                  backgroundColor: 'error.light',
                                  color: 'error.contrastText',
                                },
                                transition: 'all 0.2s'
                              }}
                            >
                              <HighlightOff fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              height: '100%',
              backgroundColor: 'background.paper',
              border: (theme) => `1px solid ${theme.palette.divider}`,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: darkMode ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.12)',
              }
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <div>
                <Typography variant="h6" sx={{ fontFamily: 'Poppins', fontWeight: 600 }}>
                  Partner Directory
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Poppins' }}>
                  Full visibility into all registered users
                </Typography>
              </div>
              <Chip 
                label={`${allUsers.length} total`} 
                color="primary" 
                sx={{ fontFamily: 'Poppins', fontWeight: 600 }}
              />
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontFamily: 'Poppins', fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontFamily: 'Poppins', fontWeight: 600 }}>Role</TableCell>
                  <TableCell sx={{ fontFamily: 'Poppins', fontWeight: 600 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && allUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <Typography variant="body2" color="text.secondary" align="center" sx={{ fontFamily: 'Poppins' }}>
                        Loading users...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : allUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <Typography variant="body2" color="text.secondary" align="center" sx={{ fontFamily: 'Poppins' }}>
                        No users found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  allUsers.map((account) => (
                    <TableRow 
                      key={account.id}
                      sx={{ 
                        '&:hover': {
                          backgroundColor: 'action.hover',
                        }
                      }}
                    >
                      <TableCell>
                        <Typography variant="subtitle2" sx={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                          {account.fullName || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'Poppins' }}>
                          {account.email || 'No email'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          size="small" 
                          label={account.userType} 
                          variant="outlined" 
                          sx={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={account.status || 'PENDING'}
                          color={
                            account.status === 'APPROVED'
                              ? 'success'
                              : account.status === 'PENDING'
                              ? 'warning'
                              : 'error'
                          }
                          variant="outlined"
                          sx={{ fontFamily: 'Poppins', fontWeight: 500 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
    </PanelLayout>
  );
};

export default AdminPanel;

