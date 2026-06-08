import { commonTheme } from '@client/App';
import { useAppBarScrollElevation } from '@client/hooks/useAppBarScrollElevation';
import { AppBar, type AppBarProps } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledAppBar = styled(AppBar)(() => ({
  paddingTop: commonTheme.safeArea.top,
}));

export const SafeAreaAppBar = ({ position = 'sticky', ...props }: AppBarProps) => {
  const elevation = useAppBarScrollElevation();
  return <StyledAppBar position={position} elevation={elevation} {...props} />;
};
