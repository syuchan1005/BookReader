import React from 'react';
import {
  Button,
  createStyles,
  Icon,
  IconButton,
  makeStyles,
  Menu,
  MenuItem,
  MuiThemeProvider,
  Slider, Theme,
} from '@material-ui/core';
import { orange } from '@material-ui/core/colors';
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
      ...commonTheme.appbar(theme, 'top', ` + ${theme.spacing(2)}px`),
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
  const [settingsMenuAnchor, setSettingsMenuAnchor] = useMenuAnchor();
  const [effectMenuAnchor, setEffectMenuAnchor, resetEffectMenuAnchor] = useMenuAnchor();

  const toggleOriginalImage = React.useCallback(() => {
    setShowOriginalImage((v) => !v);
  }, [setShowOriginalImage]);

  const clickEffect = React.useCallback((eff) => {
    onPageEffectChanged(eff);
    resetEffectMenuAnchor();
  }, [onPageEffectChanged, resetEffectMenuAnchor]);

  return (
    // eslint-disable-next-line
    <div
      className={classes.overlay}
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) {
          setHideAppBar();
        }
      }}
    >
      {/* eslint-disable-next-line */}
      <div className={`${classes.overlayContent} top`}>
        <div style={{ gridColumn: '1 / span 3' }}>{`${currentPage + 1} / ${maxPages}`}</div>
      </div>
      {/* eslint-disable-next-line */}
      <div className={`${classes.overlayContent} center`} onClick={setHideAppBar}>
        {(goPreviousBook && currentPage === 0) && (
          <Button variant="contained" color="secondary" onClick={goPreviousBook}>
            to Prev book
          </Button>
        )}
        {(goNextBook && maxPages
          && Math.abs(maxPages - currentPage) <= pageStyle.slidesPerView) && (
          <Button variant="contained" color="secondary" onClick={goNextBook}>
            to Next book
          </Button>
        )}
      </div>
      {/* eslint-disable-next-line */}
      <div className={`${classes.overlayContent} bottom`}>
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
          onClose={() => setSettingsMenuAnchor(null)}
          getContentAnchorEl={null}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem
            onClick={() => {
              setSettingsMenuAnchor(null);
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
          {['L > R', 'L < R'][readOrder]}
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
          <MuiThemeProvider
            theme={{
              direction: readOrder === ReadOrder.RTL ? 'rtl' : 'ltr',
            }}
          >
            <Slider
              color="secondary"
              valueLabelDisplay="auto"
              max={maxPages}
              min={1}
              step={pageStyle.slidesPerView}
              value={currentPage + 1}
              onChange={(e, v: number) => onPageSliderChanged(v - 1)}
            />
          </MuiThemeProvider>
        </div>
        {(pageEffect) && (
          <div className={classes.bottomSlider}>
            <MuiThemeProvider
              theme={{
                palette: {
                  primary: {
                    main: orange['700'],
                  },
                },
              }}
            >
              <Slider
                valueLabelDisplay="auto"
                max={100}
                min={0}
                value={pageEffectPercentage}
                onChange={(e, v: number) => onPageEffectPercentage(v)}
              />
            </MuiThemeProvider>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(BookPageOverlay);
