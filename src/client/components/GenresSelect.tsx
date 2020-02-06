import React from 'react';
import {
  Checkbox,
  Chip,
  createStyles,
  FormControl,
  Input,
  InputLabel,
  ListItemText,
  makeStyles,
  MenuItem,
  Select, Theme,
} from '@material-ui/core';
import { useLazyQuery } from '@apollo/react-hooks';

import { GenresQuery as GenresQueryData, GenresQueryVariables } from '@common/GQLTypes';
import GenresQuery from '@client/graphqls/common/GenresQuery.gql';

interface GenresSelectProps {
  value: string[],
  onChange?: (genres: string[]) => any,
}

const useStyles = makeStyles((theme: Theme) => createStyles({
  genreCheckBox: {
    padding: theme.spacing(0),
    margin: theme.spacing(0, 1),
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  chip: {
    margin: 2,
  },
  genreField: {
    marginBottom: theme.spacing(1),
  },
}));

const GenresSelect: React.FC<GenresSelectProps> = (props: GenresSelectProps) => {
  const classes = useStyles(props);
  const {
    value,
    onChange,
  } = props;

  const [loadGenres, {
    called,
    data: genreData,
  }] = useLazyQuery<
    GenresQueryData,
    GenresQueryVariables
    >(GenresQuery);

  return (
    <FormControl className={classes.genreField}>
      <InputLabel id="genre-label">Genres</InputLabel>
      <Select
        labelId="genre-label"
        multiple
        value={value}
        /* (event) => setSelectGenres(event.target.value as string[]) */
        onChange={(e) => (onChange && onChange(e.target.value as string[]))}
        onOpen={() => { if (!called) loadGenres(); }}
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
        {(genreData?.genres ?? []).map((g) => (
          <MenuItem key={g} value={g}>
            <Checkbox classes={{ root: classes.genreCheckBox }} size="small" checked={value.indexOf(g) > -1} />
            <ListItemText primary={g} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default GenresSelect;
