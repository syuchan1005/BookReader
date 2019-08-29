import * as React from 'react';
import { Button } from '@material-ui/core';
import useReactRouter from 'use-react-router';

const Error: React.FC = () => {
  const { history } = useReactRouter();

  return (
    <div>
      Error
      <Button onClick={() => history.push('/')}>Back</Button>
    </div>
  );
};

export default Error;
