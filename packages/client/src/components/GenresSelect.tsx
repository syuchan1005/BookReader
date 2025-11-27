import { useLazyQuery } from '@apollo/client/react';
import {
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Icon,
  IconButton,
  Input,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { GenresDocument } from '@syuchan1005/book-reader-graphql';
import { useState } from 'react';

const PREFIX = 'GenresSelect';

const classes = {
  genreCheckBox: `${PREFIX}-genreCheckBox`,
  chips: `${PREFIX}-chips`,
  chip: `${PREFIX}-chip`,
  genreField: `${PREFIX}-genreField`,
  genreSelect: `${PREFIX}-genreSelect`,
};

const Root = styled('div')(({ theme }) => ({
  [`& .${classes.genreCheckBox}`]: {
    padding: theme.spacing(0),
    margin: theme.spacing(0, 1),
  },

  [`& .${classes.chips}`]: {
    display: 'flex',
    flexWrap: 'wrap',
  },

  [`& .${classes.chip}`]: {
    margin: 2,
  },

  [`& .${classes.genreField}`]: {
    marginBottom: theme.spacing(1),
  },

  [`&.${classes.genreSelect}`]: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
  },
}));

interface GenresSelectProps {
  value: string[];
  onChange?: (genres: string[]) => void;
  showAdd?: boolean;
}

const GenresSelect = (props: GenresSelectProps) => {
  const { value, onChange, showAdd } = props;

  const [openAdd, setOpenAdd] = useState(false);
  const [addContent, setAddContent] = useState('');

  const [loadGenres, { called, data: genreData }] =
    useLazyQuery(GenresDocument);

  return (
    <Root className={classes.genreSelect}>
      <FormControl className={classes.genreField} fullWidth>
        <InputLabel id="genre-label">Genres</InputLabel>
        <Select
          labelId="genre-label"
          multiple
          value={value}
          /* (event) => setSelectGenres(event.target.value as string[]) */
          onChange={(e) => onChange?.(e.target.value as string[])}
          onOpen={() => {
            if (!called) loadGenres();
          }}
          input={<Input color="secondary" />}
          renderValue={(selected) => (
            <div className={classes.chips}>
              {(selected as string[]).map((v) => (
                <Chip
                  key={v}
                  label={v}
                  className={classes.chip}
                  size="small"
                  variant="outlined"
                />
              ))}
            </div>
          )}
        >
          {[...(genreData?.genres?.map((g) => g.name) ?? []), ...value]
            .filter((elem, index, self) => self.indexOf(elem) === index)
            .map((g) => (
              <MenuItem key={g} value={g}>
                <Checkbox
                  classes={{ root: classes.genreCheckBox }}
                  size="small"
                  checked={value.indexOf(g) > -1}
                />
                <ListItemText primary={g} />
              </MenuItem>
            ))}
        </Select>
      </FormControl>
      {showAdd && (
        <>
          <IconButton size="small" onClick={() => setOpenAdd(true)}>
            <Icon>add</Icon>
          </IconButton>
          <Dialog open={openAdd}>
            <DialogTitle>Add Genre</DialogTitle>
            <DialogContent>
              <TextField
                color="secondary"
                label="Name"
                value={addContent}
                onChange={(e) => setAddContent(e.target.value as string)}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenAdd(false)}>Close</Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => {
                  onChange(
                    [...value, addContent].filter(
                      (elem, index, self) => self.indexOf(elem) === index,
                    ),
                  );
                  setAddContent('');
                  setOpenAdd(false);
                }}
              >
                Add
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Root>
  );
};

export default GenresSelect;
