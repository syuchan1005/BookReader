import React from 'react';
import { Box, Icon, Typography } from '@mui/material';

export const EmptyScreen = () => (
  <Box
    sx={{
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      flexDirection: 'column',
      alignItems: 'center',
    }}
  >
    <Icon style={{ fontSize: 'max(10vw, 10vh)' }}>import_contacts</Icon>
    <Typography variant="h6">Book not found</Typography>
    <Typography variant="body1">
      Lets add book using the button at the bottom right!
    </Typography>
  </Box>
);
