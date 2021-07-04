import React, { ChangeEvent } from 'react';
import {
  Button,
  Chip,
  CircularProgress,
  Collapse,
  createStyles,
  FormControl,
  Icon,
  Input,
  InputLabel,
  ListItem,
  ListItemIcon,
  ListItemText,
  makeStyles,
  Menu,
  MenuItem,
  Select,
  useTheme,
} from '@material-ui/core';
import * as colors from '@material-ui/core/colors';
import { useHistory } from 'react-router-dom';
import { useRecoilState } from 'recoil';

import {
  BookInfoOrder,
  useDeleteUnusedFoldersMutation,
  useFolderSizesLazyQuery,
  useGenresQuery,
} from '@syuchan1005/book-reader-graphql/generated/GQLQueries';

import { workbox } from '@client/registerServiceWorker';
import { resetStore } from '@client/apollo';
import ColorTile from '@client/components/ColorTile';
import {
  bookHistoryState,
  genresState,
  primaryColorState,
  secondaryColorState, showBookInfoNameState,
  sortOrderState,
} from '@client/store/atoms';

interface HeaderMenuProps {
  anchorEl: Element;
  onClose?: () => void;
}

const wrapSize = (size: number) => {
  if (!size || size === -1) return '0 [B]';
  const sizes = ['', 'K', 'M', 'G', 'T'];
  let index = sizes.findIndex((v, i) => size / 10 ** (i * 3) < 1) - 1;
  if (index < 0) index = sizes.length - 1;
  return `${(size / 10 ** (index * 3)).toString(10).match(/\d+(\.\d{1,2})?/)[0]} [${sizes[index]}B]`;
};

const useStyles = makeStyles(() => createStyles({
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  chip: {
    margin: 2,
  },
  disableHover: {
    cursor: 'auto',
    '&:hover': {
      background: 'inherit',
    },
  },
}));

const HomeHeaderMenu = (props: HeaderMenuProps) => {
  const {
    anchorEl,
    onClose,
  } = props;
  const classes = useStyles(props);

  const history = useHistory();
  const [genres, setGenres] = useRecoilState(genresState);
  const [primaryColor, setPrimaryColor] = useRecoilState(primaryColorState);
  const [secondaryColor, setSecondaryColor] = useRecoilState(secondaryColorState);
  const [bookHistory, setBookHistory] = useRecoilState(bookHistoryState);
  const [sortOrder, setSortOrder] = useRecoilState(sortOrderState);
  const [showBookInfoName, setShowBookInfoName] = useRecoilState(showBookInfoNameState);
  const theme = useTheme();

  const [sortAnchorEl, setSortAnchorEl] = React.useState(null);
  const [debugAnchorEl, setDebugAnchorEl] = React.useState(null);
  const [openFolderSize, setOpenFolderSize] = React.useState(false);
  const [openCacheControl, setOpenCacheControl] = React.useState(null);

  const [colorAnchorEl, setColorAnchorEl] = React.useState(null);
  const [colorType, setColorType] = React.useState<'primary' | 'secondary'>(undefined);

  const [historyAnchorEl, setHistoryAnchorEl] = React.useState(null);

  const [getFolderSizes, { refetch, loading, data }] = useFolderSizesLazyQuery();

  const [deleteUnusedFolder, { loading: deleteLoading }] = useDeleteUnusedFoldersMutation({
    onCompleted() {
      // noinspection JSIgnoredPromiseFromCall
      refetch();
    },
  });

  const { data: genreData } = useGenresQuery();

  /* i => [apollo, storage, all] */
  const purgeCache = React.useCallback((i) => {
    const isApollo = i === 0 || i === 2;
    const isStorage = i === 1 || i === 2;
    const wb = isStorage ? workbox : undefined;
    Promise.all([
      (isApollo ? resetStore() : Promise.resolve()),
      Promise.race([
        (wb ? wb.messageSW({ type: 'PURGE_CACHE' }) : Promise.resolve()),
        new Promise((r) => setTimeout(r, 1000)), // timeout: 1000ms
      ]),
    ]).finally(() => window.location.reload());
  }, []);

  const [vConsole, setVConsole] = React.useState(undefined);
  const handleShowVConsole = React.useCallback(() => {
    if (vConsole === undefined) {
      import('vconsole').then(({ default: VConsole }) => {
        const console = new VConsole();
        // @ts-ignore
        console.setSwitchPosition(80, 20);
        setVConsole(console);
      });
    } else {
      vConsole.destroy();
      setVConsole(undefined);
    }
  }, [vConsole]);

  const handleGenresChange = React.useCallback((event: ChangeEvent<{ value: string[] }>) => {
    setGenres(event.target.value);
  }, [setGenres]);

  return (
    <>
      <Menu
        getContentAnchorEl={null}
        anchorOrigin={{
          horizontal: 'center',
          vertical: 'bottom',
        }}
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => (onClose && onClose())}
      >
        <MenuItem disableRipple disableTouchRipple className={classes.disableHover}>
          <FormControl fullWidth style={{ maxWidth: 170 }}>
            <InputLabel>Genres</InputLabel>
            <Select
              multiple
              input={<Input />}
              value={genres}
              onChange={handleGenresChange}
              renderValue={(selected) => (
                <div className={classes.chips}>
                  {(selected as string[]).map((value) => (
                    <Chip
                      key={value}
                      label={value}
                      className={classes.chip}
                    />
                  ))}
                </div>
              )}
            >
              {(genreData?.genres?.map((g) => g.name) ?? []).map((name) => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </MenuItem>
        <MenuItem onClick={(e) => setHistoryAnchorEl(e.currentTarget)}>
          History:
          {' '}
          {bookHistory}
        </MenuItem>
        <MenuItem onClick={(e) => setSortAnchorEl(e.currentTarget)}>
          {`Sort: ${sortOrder}`}
        </MenuItem>
        <MenuItem
          onClick={(e) => {
            setColorType('primary');
            setColorAnchorEl(e.currentTarget);
          }}
        >
          <span>Primary:</span>
          <ColorTile marginLeft color={primaryColor} />
        </MenuItem>
        <MenuItem
          onClick={(e) => {
            setColorType('secondary');
            setColorAnchorEl(e.currentTarget);
          }}
        >
          <span>Secondary:</span>
          <ColorTile marginLeft color={secondaryColor} />
        </MenuItem>
        <MenuItem onClick={() => setShowBookInfoName((v) => !v)}>
          <span>{`${showBookInfoName ? 'Hide' : 'Show'} InfoName`}</span>
        </MenuItem>
        <MenuItem onClick={() => history.push('/setting')}>
          <ListItemIcon><Icon>settings</Icon></ListItemIcon>
          Settings
        </MenuItem>
        <MenuItem onClick={() => setDebugAnchorEl(!debugAnchorEl)}>
          Debug
          <Icon>{`keyboard_arrow_${debugAnchorEl ? 'up' : 'down'}`}</Icon>
        </MenuItem>
        <Collapse in={debugAnchorEl}>
          <MenuItem onClick={handleShowVConsole}>
            {`${vConsole !== undefined ? 'Hide' : 'Show'} vConsole`}
          </MenuItem>
          <MenuItem onClick={() => setOpenCacheControl(!openCacheControl)}>
            Cache Control
            <Icon>{`keyboard_arrow_${openCacheControl ? 'up' : 'down'}`}</Icon>
          </MenuItem>
          <Collapse in={openCacheControl}>
            {['Purge apollo cache', 'Purge cacheStorage', 'Purge All'].map((order, i) => (
              <MenuItem
                key={order}
                onClick={() => purgeCache(i)}
                style={{ paddingLeft: theme.spacing(3) }}
              >
                {order}
              </MenuItem>
            ))}
          </Collapse>
          <MenuItem
            onClick={() => {
              if (!openFolderSize) getFolderSizes();
              setOpenFolderSize(!openFolderSize);
            }}
          >
            Folder sizes
            <Icon>{`keyboard_arrow_${openFolderSize ? 'up' : 'down'}`}</Icon>
          </MenuItem>
          <Collapse in={openFolderSize}>
            {(deleteLoading || loading || !data) ? (
              <MenuItem style={{ display: 'flex', justifyContent: 'center' }}>
                <CircularProgress color="secondary" />
              </MenuItem>
            ) : (
              <>
                {Object.entries(data.sizes)
                  .filter(([k]) => !k.startsWith('_'))
                  .map(([k, v]: [string, number]) => (
                    <ListItem
                      key={k}
                      style={{
                        paddingLeft: theme.spacing(3),
                        paddingTop: 0,
                        paddingBottom: 0,
                      }}
                    >
                      <ListItemText primary={k} secondary={k.endsWith('Count') ? v : wrapSize(v)} />
                    </ListItem>
                  ))}
                <ListItem>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => deleteUnusedFolder()}
                  >
                    Delete Unused and Cache
                  </Button>
                </ListItem>
              </>
            )}
          </Collapse>
        </Collapse>
        <MenuItem onClick={() => window.open('https://github.com/syuchan1005/BookReader')}>
          GitHub - BookReader
        </MenuItem>
      </Menu>
      <Menu
        getContentAnchorEl={null}
        anchorOrigin={{
          horizontal: 'center',
          vertical: 'bottom',
        }}
        anchorEl={sortAnchorEl}
        open={!!sortAnchorEl}
        onClose={() => setSortAnchorEl(null)}
      >
        {Object.keys(BookInfoOrder).map((order: BookInfoOrder) => (
          <MenuItem
            key={order}
            onClick={() => {
              setSortOrder(BookInfoOrder[order]);
              setSortAnchorEl(null);
            }}
          >
            {BookInfoOrder[order]}
          </MenuItem>
        ))}
      </Menu>
      <Menu
        anchorEl={colorAnchorEl}
        open={!!colorAnchorEl && !!colorType}
        onClose={() => {
          setColorAnchorEl(null);
          setColorType(undefined);
        }}
        PaperProps={{
          style: { maxHeight: theme.spacing(7 * 5) },
        }}
      >
        {Object.keys(colors).map((c) => ((c !== 'common') ? (
          <MenuItem
            key={c}
            onClick={() => {
              if (colorType === 'primary') {
                setPrimaryColor(c);
              } else {
                setSecondaryColor(c);
              }
              setColorType(undefined);
              setColorAnchorEl(null);
            }}
          >
            <ColorTile color={c} />
          </MenuItem>
        ) : null))}
      </Menu>
      <Menu
        getContentAnchorEl={null}
        anchorEl={historyAnchorEl}
        anchorOrigin={{
          horizontal: 'center',
          vertical: 'bottom',
        }}
        open={!!historyAnchorEl}
        onClose={() => {
          setHistoryAnchorEl(null);
        }}
      >
        {['SHOW', 'HIDE', 'ALL'].map((s: 'SHOW' | 'HIDE' | 'ALL') => (
          <MenuItem
            key={s}
            onClick={() => {
              setHistoryAnchorEl(null);
              setBookHistory(s);
            }}
          >
            {s}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default React.memo(HomeHeaderMenu);
