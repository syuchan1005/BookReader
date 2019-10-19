import * as React from 'react';
import { Button } from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import { useGlobalStore } from '@client/store/StoreProvider';

const Error: React.FC = () => {
  const { dispatch } = useGlobalStore();
  const history = useHistory();

  React.useEffect(() => {
    dispatch({
      barTitle: 'Error',
    });
  }, []);

  return (
    <div>
      Error
      <Button onClick={() => history.push('/')}>Back</Button>
    </div>
  );
};

// @ts-ignore
Error.whyDidYouRender = true;

export default Error;
