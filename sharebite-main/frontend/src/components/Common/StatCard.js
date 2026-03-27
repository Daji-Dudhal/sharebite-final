import React from 'react';
import { Paper, Stack, Typography, Avatar } from '@mui/material';

const StatCard = ({ label, value, icon, color = 'primary' }) => (
  <Paper 
    elevation={0} 
    sx={{ 
      p: 3, 
      height: '100%',
      backgroundColor: 'background.paper',
      border: (theme) => `1px solid ${theme.palette.divider}`,
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: (theme) => theme.palette.mode === 'dark' 
          ? '0 8px 24px rgba(0,0,0,0.4)' 
          : '0 8px 24px rgba(0,0,0,0.12)',
      }
    }}
  >
    <Stack direction="row" spacing={2} alignItems="center">
      <Avatar
        sx={{
          bgcolor: `${color}.light`,
          color: `${color}.main`,
          width: 56,
          height: 56,
        }}
      >
        {icon}
      </Avatar>
      <div>
        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Poppins' }}>
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={700} sx={{ fontFamily: 'Poppins' }}>
          {value}
        </Typography>
      </div>
    </Stack>
  </Paper>
);

export default StatCard;

