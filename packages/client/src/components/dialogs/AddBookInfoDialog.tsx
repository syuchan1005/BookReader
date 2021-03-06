import React from 'react';
import {
  Button,
  CircularProgress,
  createStyles,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Icon,
  IconButton,
  List,
  ListItem,
  makeStyles,
  TextField,
  Theme,
} from '@material-ui/core';

import { useAddBookInfoMutation, useAddBookInfoHistoriesMutation } from '@syuchan1005/book-reader-graphql/generated/GQLQueries';
import GenresSelect from '../GenresSelect';

interface AddBookInfoDialogProps {
  open: boolean;
  name?: string;
  onAdded?: () => void;
  onClose?: () => void;
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  dialog: {
    width: '100%',
    height: '100%',
  },
  addContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  listItem: {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: '1fr 50px 48px',
    marginBottom: theme.spacing(0.5),
  },
  historyListItem: {
    width: '100%',
    display: 'grid',
    gridColumnGap: theme.spacing(1),
    gridTemplateColumns: '1fr 55px 30px',
  },
  addBookInfoProgress: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  progressMessage: {
    marginTop: theme.spacing(2),
    gridColumn: '1 / end',
    textAlign: 'center',
  },
}));

const AddBookInfoDialog = (props: AddBookInfoDialogProps) => {
  const classes = useStyles(props);
  const {
    onAdded,
    onClose,
    open,
    name: argName,
  } = props;
  const [name, setName] = React.useState('');
  const [showAddHistory, setShowAddHistory] = React.useState(false);
  const [addHistories, setAddHistories] = React.useState([]);
  const historyBulkRef = React.useRef(null);
  const [selectGenres, setSelectGenres] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (open && argName) {
      setName(argName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const changeAddHistories = React.useCallback((index, field, value) => {
    setAddHistories((histories) => {
      const a = [...histories];
      a[index][field] = value;
      return a;
    });
  }, []);

  const closeDialog = React.useCallback(() => {
    if (onClose) onClose();
    setShowAddHistory(false);
    if (name !== '') {
      setName('');
    }
    if (addHistories.length !== 0) {
      setAddHistories([]);
    }
    if (selectGenres.length !== 0) {
      setSelectGenres([]);
    }
  }, [addHistories, name, onClose, selectGenres]);

  const [addBookInfo, { loading: addLoading }] = useAddBookInfoMutation({
    variables: {
      name,
      genres: selectGenres,
    },
    onCompleted(d) {
      if (!d) return;
      closeDialog();
      if (d.add.success && onAdded) onAdded();
    },
  });

  const [addBookInfoHistories, { loading: histLoading }] = useAddBookInfoHistoriesMutation({
    onCompleted(d) {
      if (!d) return;
      closeDialog();
      if (d.add.success && onAdded) onAdded();
    },
    variables: {
      histories: addHistories.map((h) => ({ name: h.name, count: Number(h.count) })),
    },
  });

  const loading = React.useMemo(() => addLoading || histLoading, [addLoading, histLoading]);

  const addHistoriesEntity = () => {
    const a = [...(addHistories.filter((h) => h.name))];
    a.push({ name: '', count: 0 });
    setAddHistories(a);
  };

  const onFilePicked = (event) => {
    const { files } = event.target;
    if (files[0] === undefined) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target.result !== 'string') return;
      const obj = e.target.result
        .split('\n')
        .filter((s) => s && s.length >= 1)
        .map((s) => s.match(/^(.+) (\d+)(-(\d+))?/))
        .map((m) => ({ name: m[1], count: Number(m[4] || m[2]) }));
      setAddHistories([...addHistories, ...obj].filter((h) => h.name));
    };
    reader.readAsText(files[0]);
  };

  return (
    <Dialog open={open} onClose={() => !loading && closeDialog()}>
      <DialogTitle>{`Add book info${showAddHistory ? ' history' : ''}`}</DialogTitle>

      {(() => {
        if (showAddHistory) {
          return (
            <DialogContent>
              <List>
                {addHistories.map((h, i) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <ListItem className={classes.historyListItem} key={i}>
                    <TextField
                      placeholder="name"
                      value={h.name}
                      onChange={(e) => changeAddHistories(i, 'name', e.target.value)}
                    />
                    <TextField
                      type="number"
                      placeholder="count"
                      value={h.count}
                      onChange={(e) => changeAddHistories(i, 'count', e.target.value)}
                    />
                    <IconButton size="small" onClick={() => setAddHistories(addHistories.filter((f, k) => k !== i))}>
                      <Icon>clear</Icon>
                    </IconButton>
                  </ListItem>
                ))}
                <ListItem>
                  <Button fullWidth onClick={addHistoriesEntity}>
                    <Icon>add</Icon>
                    Add
                  </Button>
                </ListItem>
                <ListItem>
                  <Button fullWidth onClick={() => historyBulkRef.current.click()}>
                    <Icon>add</Icon>
                    bulk Add
                  </Button>
                  <input
                    type="file"
                    hidden
                    ref={historyBulkRef}
                    onChange={onFilePicked}
                  />
                </ListItem>
              </List>
            </DialogContent>
          );
        }
        if (loading) {
          return (
            <DialogContent
              className={classes.addBookInfoProgress}
            >
              <CircularProgress color="secondary" />
            </DialogContent>
          );
        }
        return (
          <DialogContent className={classes.addContent}>
            <GenresSelect
              showAdd
              value={selectGenres}
              onChange={setSelectGenres}
            />
            <TextField
              color="secondary"
              autoFocus
              label="Book info name"
              value={name}
              // @ts-ignore
              onChange={(event) => setName(event.target.value)}
            />
          </DialogContent>
        );
      })()}

      <DialogActions>
        <Button onClick={() => setShowAddHistory(!showAddHistory)} disabled={loading}>
          {`Add ${showAddHistory ? 'books' : 'history'}`}
        </Button>

        <div style={{ flex: 1 }} />

        <Button onClick={() => !loading && closeDialog()} disabled={loading}>
          close
        </Button>
        <Button
          onClick={() => {
            if (showAddHistory) {
              // noinspection JSIgnoredPromiseFromCall
              addBookInfoHistories();
            } else {
              // noinspection JSIgnoredPromiseFromCall
              addBookInfo();
            }
          }}
          disabled={loading}
          variant="contained"
          color="secondary"
        >
          add
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default React.memo(AddBookInfoDialog);
