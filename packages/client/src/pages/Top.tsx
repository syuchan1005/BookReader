import {
  BottomNavigation,
  BottomNavigationAction,
  Icon,
} from '@mui/material';
import { Box } from '@mui/material';
import { SafeAreaBottomNavigationContainer } from '@client/components/SafeAreaBottomNavigationContainer';
import { commonTheme } from '@client/App';
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

const TabItems = [
  {
    title: 'Home',
    icon: 'home',
    path: '/',
  },
  {
    title: 'BookShelf',
    icon: 'bookshelf',
    path: '/bookshelf',
  },
];

const Top = () => {
  const location = useLocation();
  const [tabIndex, setTabIndex] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: TODO: location
  useEffect(() => {
    const i = TabItems.findIndex(
      ({ path }) => path !== '/' && location.pathname.startsWith(path),
    );
    setTabIndex(Math.max(0, i));
  }, []);

  return (
    <Box sx={{ paddingBottom: `calc(${commonTheme.safeArea.bottom} + 56px)` }}>
      <Outlet />
      <SafeAreaBottomNavigationContainer elevation={3}>
        <BottomNavigation
          sx={{ backgroundColor: 'transparent' }}
          showLabels
          value={tabIndex}
          onChange={(_a, b) => setTabIndex(b)}
        >
          {TabItems.map((tab, i) => (
            <BottomNavigationAction
              key={tab.title}
              value={i}
              label={tab.title}
              icon={<Icon>{tab.icon}</Icon>}
              component={Link}
              replace
              to={tab.path}
            />
          ))}
        </BottomNavigation>
      </SafeAreaBottomNavigationContainer>
    </Box>
  );
};

export default Top;
