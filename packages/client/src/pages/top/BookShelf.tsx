import React from 'react';
import {
  AppBar,
  Box,
  Tabs,
  Tab,
  useTheme,
} from '@mui/material';
import useMediaQuery from '@client/hooks/useMediaQuery';

const TabItems = [
  {
    title: 'Favorite',
  },
  {
    title: 'History',
  },
];

const BookShelf = () => {
  const theme = useTheme();

  const [tabItemI, setTabItem] = React.useState(0);

  const downXs = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <>
      <AppBar sx={{ color: theme.palette.common.white }}>
        <Tabs
          value={tabItemI}
          onChange={(e, value) => setTabItem(value)}
          centered={downXs}
          variant={downXs ? 'fullWidth' : 'standard'}
          textColor="inherit"
          indicatorColor="secondary"
        >
          {TabItems.map((tabItem, index) => (
            <Tab
              sx={{ typography: 'h6' }}
              key={tabItem.title}
              value={index}
              label={tabItem.title}
            />
          ))}
        </Tabs>
      </AppBar>
      <Box component="main" sx={{ py: 7 }}>
        Not implemented yet
      </Box>
    </>
  );
};

export default React.memo(BookShelf);
