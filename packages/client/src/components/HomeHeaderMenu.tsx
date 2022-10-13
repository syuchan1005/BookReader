import React from 'react';
import {
  Button,
  CircularProgress,
  Collapse,
  Icon,
  ListItem,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  useTheme,
} from '@mui/material';
import * as colors from '@mui/material/colors';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRecoilState } from 'recoil';

import {
  BookInfoOrder,
  useDeleteUnusedFoldersMutation,
  useDebugBookCountsLazyQuery,
  useRebuildMeiliSearchMutation,
} from '@syuchan1005/book-reader-graphql/generated/GQLQueries';

import { workbox } from '@client/registerServiceWorker';
import { resetStore } from '@client/apollo';
import ColorTile from '@client/components/ColorTile';
import {
  primaryColorState,
  secondaryColorState,
  showBookInfoNameState,
  sortOrderState,
} from '@client/store/atoms';
import { exportDbJson, importDbJson } from '@client/indexedDb/DBFileController';

interface HeaderMenuProps {
  anchorEl: Element;
  onClose?: () => void;
}

const HomeHeaderMenu = (props: HeaderMenuProps) => {
  const {
    anchorEl,
    onClose,
  } = props;

  const navigate = useNavigate();
  const location = useLocation();
  const [primaryColor, setPrimaryColor] = useRecoilState(primaryColorState);
  const [secondaryColor, setSecondaryColor] = useRecoilState(secondaryColorState);
  const [sortOrder, setSortOrder] = useRecoilState(sortOrderState);
  const [showBookInfoName, setShowBookInfoName] = useRecoilState(showBookInfoNameState);
  const theme = useTheme();

  const [sortAnchorEl, setSortAnchorEl] = React.useState(null);
  const [debugAnchorEl, setDebugAnchorEl] = React.useState(null);
  const [openBookCounts, setOpenBookCounts] = React.useState(false);
  const [openCacheControl, setOpenCacheControl] = React.useState(null);
  const [openIndexedDBMenu, setOpenIndexedDBMenu] = React.useState(null);

  const [colorAnchorEl, setColorAnchorEl] = React.useState(null);
  const [colorType, setColorType] = React.useState<'primary' | 'secondary'>(undefined);

  const [getBookCounts, {
    refetch,
    loading,
    data,
  }] = useDebugBookCountsLazyQuery();

  const [deleteUnusedFolder, { loading: deleteLoading }] = useDeleteUnusedFoldersMutation({
    onCompleted() {
      // noinspection JSIgnoredPromiseFromCall
      refetch();
    },
  });

  /* i => [apollo, storage, all] */
  const purgeCache = React.useCallback((i) => {
    const isApollo = i === 0 || i === 2;
    const isStorage = i === 1 || i === 2;
    const wb = isStorage ? workbox : undefined;
    Promise.all([
      (isApollo ? resetStore() : Promise.resolve()),
      Promise.race([
        (wb ? wb.messageSW({ type: 'PURGE_CACHE' }) : Promise.resolve()),
        new Promise((r) => { setTimeout(r, 1000); }), // timeout: 1000ms
      ]),
    ])
      .finally(() => window.location.reload());
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

  const [rebuildMeiliSearchMutation, { loading: rebuilding }] = useRebuildMeiliSearchMutation();

  return (
    <>
      <Menu
        anchorOrigin={{
          horizontal: 'center',
          vertical: 'bottom',
        }}
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => (onClose && onClose())}
      >
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
        <MenuItem
          onClick={() => navigate('/setting', {
            state: {
              referrer: location.pathname,
            },
          })}
        >
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
              if (!openBookCounts) getBookCounts();
              setOpenBookCounts(!openBookCounts);
            }}
          >
            Book counts
            <Icon>{`keyboard_arrow_${openBookCounts ? 'up' : 'down'}`}</Icon>
          </MenuItem>
          <Collapse in={openBookCounts}>
            {(deleteLoading || loading || !data) ? (
              <MenuItem style={{
                display: 'flex',
                justifyContent: 'center',
              }}
              >
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
                      <ListItemText primary={k} secondary={v} />
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
          <MenuItem onClick={() => setOpenIndexedDBMenu(!openIndexedDBMenu)}>
            IndexedDB
            <Icon>{`keyboard_arrow_${openIndexedDBMenu ? 'up' : 'down'}`}</Icon>
          </MenuItem>
          <Collapse in={openIndexedDBMenu}>
            <MenuItem onClick={() => exportDbJson()}>
              Export indexedDB
            </MenuItem>
            <MenuItem onClick={() => importDbJson()}>
              Import indexedDB (merge & overwrite)
            </MenuItem>
          </Collapse>
          <MenuItem onClick={() => { rebuildMeiliSearchMutation(); }} disabled={rebuilding}>
            Rebuild MeiliSearch indexes
          </MenuItem>
        </Collapse>
        <MenuItem onClick={() => window.open('https://github.com/syuchan1005/BookReader')}>
          GitHub - BookReader
        </MenuItem>
      </Menu>
      <Menu
        anchorOrigin={{
          horizontal: 'center',
          vertical: 'bottom',
        }}
        anchorEl={sortAnchorEl}
        open={!!sortAnchorEl}
        onClose={() => setSortAnchorEl(null)}
      >
        {Object.keys(BookInfoOrder)
          .map((order: BookInfoOrder) => (
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
        {Object.keys(colors)
          .map((c) => ((c !== 'common') ? (
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
    </>
  );
};

export default React.memo(HomeHeaderMenu);
