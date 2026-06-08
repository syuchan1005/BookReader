import { commonTheme } from '@client/App';
import { Paper, type PaperProps } from '@mui/material';
import { styled } from '@mui/material/styles';

export const SafeAreaBottomNavigationContainer = styled(Paper)<PaperProps>(({ theme }) => ({
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: theme.zIndex.appBar,
  paddingBottom: commonTheme.safeArea.bottom,
  backgroundColor: theme.palette.background.paper,
  backgroundImage: 'none',
}));
