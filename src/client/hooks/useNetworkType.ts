import * as React from 'react';

const useNetworkType = () => {
  const [type, setType] = React.useState<'ethernet' | 'cellular' | 'unknown'>('unknown');

  React.useEffect(() => {
    // @ts-ignore
    // eslint-disable-next-line max-len
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    if (!connection || !connection.type) {
      setType('unknown');
    } else if (['ethernet', 'wifi', 'wimax'].includes(connection.type)) {
      setType('ethernet');
    } else {
      setType('cellular');
    }
  }, []);

  return type;
};

export default useNetworkType;
