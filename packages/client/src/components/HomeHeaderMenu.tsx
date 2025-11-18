import { resetStore } from '@client/apollo';
import ColorTile from '@client/components/ColorTile';
import { exportDbJson, importDbJson } from '@client/indexedDb/DBFileController';
import { workbox } from '@client/registerServiceWorker';
import {
  primaryColorState,
  secondaryColorState,
  showBookInfoNameState,
  sortOrderState,
} from '@client/store/atoms';
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
import {
  BookInfoOrder,
  useDebugBookCountsLazyQuery,
  useDeleteUnusedFoldersMutation,
  useRebuildMeiliSearchMutation,
} from '@syuchan1005/book-reader-graphql';
import { useAtom } from 'jotai';
import { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface HeaderMenuProps {
  anchorEl: Element;
  onClose?: () => void;
}

const HomeHeaderMenu = (props: HeaderMenuProps) => {
  const { anchorEl, onClose } = props;

  const navigate = useNavigate();
  const location = useLocation();
  const [primaryColor, setPrimaryColor] = useAtom(primaryColorState);
  const [secondaryColor, setSecondaryColor] = useAtom(secondaryColorState);
  const [sortOrder, setSortOrder] = useAtom(sortOrderState);
  const [showBookInfoName, setShowBookInfoName] = useAtom(
    showBookInfoNameState,
  );
  const theme = useTheme();

  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const [debugAnchorEl, setDebugAnchorEl] = useState(null);
  const [openBookCounts, setOpenBookCounts] = useState(false);
  const [openCacheControl, setOpenCacheControl] = useState(null);
  const [openIndexedDBMenu, setOpenIndexedDBMenu] = useState(null);

  const [colorAnchorEl, setColorAnchorEl] = useState(null);
  const [colorType, setColorType] = useState<'primary' | 'secondary'>(
    undefined,
  );

  const [getBookCounts, { refetch, loading, data }] =
    useDebugBookCountsLazyQuery();

  const [deleteUnusedFolder, { loading: deleteLoading }] =
    useDeleteUnusedFoldersMutation({
      onCompleted() {
        // noinspection JSIgnoredPromiseFromCall
        refetch();
      },
    });

  /* i => [apollo, storage, all] */
  const purgeCache = useCallback((i) => {
    const isApollo = i === 0 || i === 2;
    const isStorage = i === 1 || i === 2;
    const wb = isStorage ? workbox : undefined;
    Promise.all([
      isApollo ? resetStore() : Promise.resolve(),
      Promise.race([
        wb ? wb.messageSW({ type: 'PURGE_CACHE' }) : Promise.resolve(),
        new Promise((r) => {
          setTimeout(r, 1000);
        }), // timeout: 1000ms
      ]),
    ]).finally(() => window.location.reload());
  }, []);

  const [vConsole, setVConsole] = useState(undefined);
  const handleShowVConsole = useCallback(() => {
    if (vConsole === undefined) {
      import('vconsole').then(({ default: VConsole }) => {
        const console = new VConsole();
        // @ts-expect-error
        console.setSwitchPosition(80, 20);
        setVConsole(console);
      });
    } else {
      vConsole.destroy();
      setVConsole(undefined);
    }
  }, [vConsole]);

  const [rebuildMeiliSearchMutation, { loading: rebuilding }] =
    useRebuildMeiliSearchMutation();

  return (
    <>
      <Menu
        anchorOrigin={{
          horizontal: 'center',
          vertical: 'bottom',
        }}
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => onClose?.()}
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
          onClick={() =>
            navigate('/setting', {
              state: {
                referrer: location.pathname,
              },
            })
          }
        >
          <ListItemIcon>
            <Icon>settings</Icon>
          </ListItemIcon>
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
            {['Purge apollo cache', 'Purge cacheStorage', 'Purge All'].map(
              (order, i) => (
                <MenuItem
                  key={order}
                  onClick={() => purgeCache(i)}
                  style={{ paddingLeft: theme.spacing(3) }}
                >
                  {order}
                </MenuItem>
              ),
            )}
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
            {deleteLoading || loading || !data ? (
              <MenuItem
                style={{
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
            <MenuItem onClick={() => exportDbJson()}>Export indexedDB</MenuItem>
            <MenuItem onClick={() => importDbJson()}>
              Import indexedDB (merge & overwrite)
            </MenuItem>
          </Collapse>
          <MenuItem
            onClick={() => {
              rebuildMeiliSearchMutation();
            }}
            disabled={rebuilding}
          >
            Rebuild MeiliSearch indexes
          </MenuItem>
        </Collapse>
        <MenuItem
          onClick={() =>
            window.open('https://github.com/syuchan1005/BookReader')
          }
        >
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
        {Object.keys(colors).map((c) =>
          c !== 'common' ? (
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
          ) : null,
        )}
      </Menu>
    </>
  );
};

export default HomeHeaderMenu;
