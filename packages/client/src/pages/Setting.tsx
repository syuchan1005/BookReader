import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Icon,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Theme,
  Toolbar,
  Typography,
  useTheme,
  Switch,
} from '@mui/material';

import createStyles from '@mui/styles/createStyles';
import makeStyles from '@mui/styles/makeStyles';

import { useDeleteGenreMutation, useEditGenreMutation, useGenresQuery } from '@syuchan1005/book-reader-graphql/generated/GQLQueries';

import { defaultGenres, defaultTitle } from '@syuchan1005/book-reader-common';
import TitleAndBackHeader from '@client/components/TitleAndBackHeader';

const useStyles = makeStyles((theme: Theme) => createStyles({
  setting: {
    margin: theme.spacing(1, 2, 0, 2),
    height: 'fit-content',
  },
}));

const Setting = (props) => {
  const classes = useStyles(props);
  const theme = useTheme();

  React.useEffect(() => {
    document.title = defaultTitle;
  }, []);

  const {
    data: genreData,
    loading: genreLoading,
    refetch: genreRefetch,
  } = useGenresQuery();

  const [editGenre, setEditGenre] = useState<string>(undefined);
  const [editGenreContent, setEditGenreContent] = useState('');
  const [deleteGenre, setDeleteGenre] = useState<string>(undefined);

  const [
    doDeleteGenre,
    { loading: deleteGenreLoading },
  ] = useDeleteGenreMutation({
    variables: {
      name: deleteGenre,
    },
    onCompleted({ deleteGenre: genreResult }) {
      if (genreResult.success) {
        setDeleteGenre(undefined);
        genreRefetch();
      }
    },
  });
  const [
    doEditGenre,
    { loading: editGenreLoading },
  ] = useEditGenreMutation({
    onCompleted({ editGenre: genreResult }) {
      if (genreResult.success) {
        setEditGenreContent(undefined);
        setEditGenre(undefined);
        genreRefetch();
      }
    },
  });

  return (
    <>
      <TitleAndBackHeader
        title="Setting"
      />
      <Toolbar />

      <main className={classes.setting}>
        {(!genreLoading && genreData) && (
          <>
            <Typography variant="h6">
              Genres
              <IconButton
                size="small"
                style={{ marginLeft: theme.spacing(1) }}
                onClick={() => genreRefetch()}
              >
                <Icon>refresh</Icon>
              </IconButton>
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Invisible</TableCell>
                    <TableCell align="left">Name</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {genreData.genres
                    .map((genre) => (
                      <TableRow key={genre.name}>
                        <TableCell>
                          <Switch
                            checked={genre.invisible}
                            onChange={(event) => doEditGenre({
                              variables: {
                                oldName: genre.name,
                                invisible: event.target.checked,
                              },
                            })}
                            disabled={defaultGenres.includes(genre.name)}
                          />
                        </TableCell>
                        <TableCell align="left">
                          {(editGenre === genre.name) ? (
                            <>
                              <TextField
                                autoFocus
                                size="small"
                                value={editGenreContent}
                                onChange={(e) => setEditGenreContent(e.target.value as string)}
                              />
                              <IconButton
                                size="small"
                                disabled={editGenre === editGenreContent || editGenreLoading}
                                onClick={() => doEditGenre({
                                  variables: {
                                    oldName: genre.name,
                                    newName: editGenreContent,
                                  },
                                })}
                              >
                                <Icon>check</Icon>
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => setEditGenre(undefined)}
                                disabled={editGenreLoading}
                              >
                                <Icon>clear</Icon>
                              </IconButton>
                            </>
                          ) : genre.name}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setDeleteGenre(undefined);
                              setEditGenre(genre.name);
                              setEditGenreContent(genre.name);
                            }}
                          >
                            <Icon>edit</Icon>
                          </IconButton>
                          <IconButton
                            size="small"
                            disabled={defaultGenres.includes(genre.name)}
                            onClick={() => {
                              setDeleteGenre(genre.name);
                              setEditGenre(undefined);
                              setEditGenreContent('');
                            }}
                          >
                            <Icon>delete</Icon>
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Dialog open={!!deleteGenre}>
              <DialogTitle>Delete Genre</DialogTitle>
              <DialogContent>
                {`Do you want to delete the "${deleteGenre}"?`}
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={() => setDeleteGenre(undefined)}
                  disabled={deleteGenreLoading}
                >
                  Close
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => doDeleteGenre()}
                  disabled={deleteGenreLoading}
                >
                  Delete
                </Button>
              </DialogActions>
            </Dialog>
          </>
        )}
      </main>
    </>
  );
};

export default React.memo(Setting);
