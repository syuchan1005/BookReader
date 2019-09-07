import * as React from 'react';
import { Button } from '@material-ui/core';
import useReactRouter from 'use-react-router';

interface ErrorProps {
  store: any;
  children?: React.ReactElement;
}

const Error: React.FC = (props: ErrorProps) => {
  // eslint-disable-next-line
  props.store.barTitle = 'Error';
  const { history } = useReactRouter();

  return (
    <div>
      Error
      <Button onClick={() => history.push('/')}>Back</Button>
    </div>
  );
};

export default Error;
