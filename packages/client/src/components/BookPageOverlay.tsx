import React, { MouseEventHandler } from 'react';
import {
  Button,
  Icon,
  IconButton,
  Menu,
  MenuItem,
  ThemeProvider,
  StyledEngineProvider,
  Slider,
  Theme,
} from '@mui/material';
import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';
import { orange } from '@mui/material/colors';
import { useRecoilState } from 'recoil';

import { commonTheme } from '@client/App';
import useMenuAnchor from '@client/hooks/useMenuAnchor';
import { PageEffect, PageStyleType } from '@client/pages/Book';
import { ReadOrder, readOrderState, showOriginalImageState } from '@client/store/atoms';

interface BookPageOverlayProps {
  currentPage: number;
  onPageSliderChanged: (page: number) => void;
  maxPages: number | undefined;
  pageStyle: PageStyleType;
  onPageStyleClick: () => void;
  pageEffect: PageEffect | undefined;
  onPageEffectChanged: (pageEffect: PageEffect | undefined) => void;
  pageEffectPercentage: number;
  onPageEffectPercentage: (percent: number) => void;
  setHideAppBar: () => void;
  goNextBook: () => void | undefined;
  goPreviousBook: () => void | undefined;
  onEditClick: () => void;
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  overlay: {
    zIndex: 2,
    top: '0',
    position: 'fixed',
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    userSelect: 'none',
  },
  overlayContent: {
    userSelect: 'none',
    background: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    display: 'grid',
    gridTemplateRows: '1fr',
    gridTemplateColumns: '1fr 1fr 1fr',
    '& > div': {
      textAlign: 'center',
    },
    padding: theme.spacing(1),
    borderRadius: theme.spacing(1),
    position: 'absolute',
    '&.top': {
      ...commonTheme.appbar(theme, 'top', ` + ${theme.spacing(2)}`),
      whiteSpace: 'nowrap',
    },
    '&.bottom': {
      width: '80%',
      gridTemplateRows: 'auto auto',
      gridTemplateColumns: '1fr 1fr 1fr 1fr',
      bottom: theme.spacing(2),
    },
    '&.center': {
      background: 'inherit',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      '& > button + button': {
        marginTop: theme.spacing(1),
      },
    },
  },
  bottomSlider: {
    gridColumn: '1 / span 4',
    margin: theme.spacing(0, 2),
  },
}));

const stopPropagationListener: MouseEventHandler<any> = (e) => {
  e.stopPropagation();
};

const BookPageOverlay = (props: BookPageOverlayProps) => {
  const classes = useStyles(props);
  const {
    currentPage,
    maxPages,
    pageStyle,
    pageEffect,
    pageEffectPercentage,
    setHideAppBar,
    goNextBook,
    goPreviousBook,
    onPageStyleClick,
    onEditClick,
    onPageEffectChanged,
    onPageEffectPercentage,
    onPageSliderChanged,
  } = props;

  const [readOrder, setReadOrder] = useRecoilState(readOrderState);
  const [showOriginalImage, setShowOriginalImage] = useRecoilState(showOriginalImageState);
  const [settingsMenuAnchor, setSettingsMenuAnchor, resetSettingMenuAnchor] = useMenuAnchor();
  const [effectMenuAnchor, setEffectMenuAnchor, resetEffectMenuAnchor] = useMenuAnchor();

  const toggleOriginalImage = React.useCallback(() => {
    setShowOriginalImage((v) => !v);
  }, [setShowOriginalImage]);

  const clickEffect = React.useCallback((eff) => {
    onPageEffectChanged(eff);
    resetEffectMenuAnchor();
  }, [onPageEffectChanged, resetEffectMenuAnchor]);

  const clickJumpPrevBook = React.useCallback((e) => {
    e.stopPropagation();
    if (goPreviousBook) {
      goPreviousBook();
    }
  }, [goPreviousBook]);

  const clickJumpNextBook = React.useCallback((e) => {
    e.stopPropagation();
    if (goNextBook) {
      goNextBook();
    }
  }, [goNextBook]);

  return (
    // eslint-disable-next-line
    <div
      className={classes.overlay}
      onClick={setHideAppBar}
    >
      {/* eslint-disable-next-line */}
      <div className={`${classes.overlayContent} center`}>
        {(goPreviousBook && currentPage === 0) && (
          <Button variant="contained" color="secondary" onClick={clickJumpPrevBook}>
            to Prev book
          </Button>
        )}
        {(goNextBook && maxPages
          && Math.abs(maxPages - currentPage) <= pageStyle.slidesPerView) && (
          <Button variant="contained" color="secondary" onClick={clickJumpNextBook}>
            to Next book
          </Button>
        )}
      </div>
      {/* eslint-disable-next-line */}
      <div className={`${classes.overlayContent} top`} onClick={stopPropagationListener}>
        <div style={{ gridColumn: '1 / span 3' }}>{`${currentPage + 1} / ${maxPages}`}</div>
      </div>
      {/* eslint-disable-next-line */}
      <div className={`${classes.overlayContent} bottom`} onClick={stopPropagationListener}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <IconButton
            size="small"
            style={{ color: 'white' }}
            aria-label="settings"
            onClick={setSettingsMenuAnchor}
          >
            <Icon>settings</Icon>
          </IconButton>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <IconButton
            size="small"
            style={{ color: 'white' }}
            onClick={onPageStyleClick}
          >
            <Icon style={pageStyle.icon.style}>{pageStyle.icon.name}</Icon>
          </IconButton>
        </div>
        <Menu
          anchorEl={settingsMenuAnchor}
          open={Boolean(settingsMenuAnchor)}
          onClose={resetSettingMenuAnchor}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem
            onClick={() => {
              resetSettingMenuAnchor();
              onEditClick();
            }}
          >
            Edit pages
          </MenuItem>
          <MenuItem
            onClick={toggleOriginalImage}
          >
            {`Show ${showOriginalImage ? 'Compressed' : 'Original'} Image`}
          </MenuItem>
        </Menu>
        <Button
          variant="outlined"
          style={{
            color: 'white',
            borderColor: 'white',
            margin: '0 auto',
          }}
          onClick={() => {
            if (readOrder === ReadOrder.RTL) {
              setReadOrder(ReadOrder.LTR);
            } else {
              setReadOrder(ReadOrder.RTL);
            }
          }}
        >
          {readOrder === ReadOrder.LTR ? 'L > R' : 'L < R'}
        </Button>
        <Button
          aria-controls="effect menu"
          aria-haspopup
          onClick={setEffectMenuAnchor}
          style={{ color: 'white' }}
        >
          {pageEffect || 'normal'}
        </Button>
        <Menu
          anchorEl={effectMenuAnchor}
          open={Boolean(effectMenuAnchor)}
          onClose={resetEffectMenuAnchor}
        >
          <MenuItem onClick={() => clickEffect(undefined)}>Normal</MenuItem>
          <MenuItem onClick={() => clickEffect('paper')}>Paper</MenuItem>
          <MenuItem onClick={() => clickEffect('dark')}>Dark</MenuItem>
        </Menu>
        <div className={classes.bottomSlider}>
          <StyledEngineProvider injectFirst>
            <ThemeProvider
              theme={{
                direction: readOrder === ReadOrder.RTL ? 'rtl' : 'ltr',
              }}
            >
              <Slider
                componentsProps={{
                  thumb: {
                    style: {
                      transform: 'translate(0, -50%)',
                    },
                  },
                }}
                color="secondary"
                valueLabelDisplay="auto"
                max={maxPages - 1}
                min={1}
                step={pageStyle.slidesPerView}
                value={currentPage + 1}
                onChange={(e, v: number) => onPageSliderChanged(v - 1)}
              />
            </ThemeProvider>
          </StyledEngineProvider>
        </div>
        {(pageEffect) && (
          <div className={classes.bottomSlider}>
            <StyledEngineProvider injectFirst>
              <ThemeProvider
                theme={(outerTheme) => ({
                  ...outerTheme,
                  palette: {
                    // @ts-ignore
                    ...outerTheme.palette,
                    primary: {
                      main: orange['700'],
                    },
                  },
                })}
              >
                <Slider
                  valueLabelDisplay="auto"
                  max={100}
                  min={0}
                  value={pageEffectPercentage}
                  onChange={(e, v: number) => onPageEffectPercentage(v)}
                />
              </ThemeProvider>
            </StyledEngineProvider>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(BookPageOverlay);
