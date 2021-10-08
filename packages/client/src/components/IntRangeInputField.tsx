import React from 'react';
import { TextField } from '@mui/material';
import { IntRange } from '@syuchan1005/book-reader-graphql/generated/GQLQueries';

interface IntRangeInputFieldProps {
  maxPage: number;
  initValue?: IntRange;
  onChange?: (intRange: IntRange) => void;
  fullWidth?: boolean;
}

const parseIntRange = (pages: string, maxPage: number): IntRange | string => {
  const pageList = pages
    .split(/,\s*/)
    .map((s) => {
      const m = s.match(/(\d+)(-(\d+))?$/);
      if (!m) return undefined;
      if (m[3]) {
        const arr = [Number(m[1]), Number(m[3])];
        return [Math.min(...arr) - 1, Math.max(...arr) - 1] as [number, number];
      }
      return Number(m[1]) - 1;
    });
  if (!pageList.every((s) => s !== undefined)) {
    return 'Format error';
  }
  if (!pageList.every((s) => {
    if (Array.isArray(s)) {
      return s[0] >= 0 && s[0] < maxPage && s[1] >= 0 && s[1] < maxPage;
    }
    return s >= 0 && s < maxPage;
  })) {
    return 'Range error';
  }
  return pageList;
};

const IntRangeInputField = (props: IntRangeInputFieldProps) => {
  const {
    maxPage,
    onChange,
    initValue,
    ...forwardProps
  } = props;
  const [inputText, setInputText] = React.useState('');
  const errorText = React.useMemo(() => {
    if (inputText === '') {
      return undefined;
    }
    const intRange = parseIntRange(inputText, maxPage);
    if (typeof intRange === 'string') {
      return intRange;
    }
    return undefined;
    // eslint-disable-next-line
  }, [inputText]);
  React.useEffect(() => {
    const intRange = parseIntRange(inputText, maxPage);
    if (typeof intRange !== 'string' && onChange && initValue !== intRange) {
      onChange(intRange);
    }
    // eslint-disable-next-line
  }, [inputText]);

  React.useEffect(() => {
    if (!initValue || inputText) return;
    const text = initValue
      .map((e) => {
        if (Array.isArray(e)) {
          return `${e[0] + 1}-${e[1] + 1}`;
        }
        return e + 1;
      })
      .join(',');
    setInputText(text);
    // eslint-disable-next-line
  }, []);

  return (
    <TextField
      error={!!errorText}
      helperText={errorText}
      label={`pages(max: ${maxPage})`}
      placeholder="ex. 1, 2, 3-5"
      color="secondary"
      value={inputText}
      onChange={(e) => setInputText(e.target.value)}
      {...forwardProps}
    />
  );
};

export default React.memo(IntRangeInputField);
