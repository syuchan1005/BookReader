import React from 'react';

const useOS = () => {
  const [os, setOS] = React.useState<undefined | 'macOS' | 'Windows' | 'Linux' | 'iOS' | 'Android'>(undefined);

  const getOS = () => {
    const { userAgent, platform } = window.navigator;
    const platforms = {
      macOS: ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
      windows: ['Win32', 'Win64', 'Windows', 'WinCE'],
      ios: ['iPhone', 'iPad', 'iPod'],
    };

    if (platforms.macOS.indexOf(platform) !== -1) {
      return 'macOS';
    }
    if (platforms.ios.indexOf(platform) !== -1) {
      return 'iOS';
    }
    if (platforms.windows.indexOf(platform) !== -1) {
      return 'Windows';
    }
    if (/Android/.test(userAgent)) {
      return 'Android';
    }
    if (/Linux/.test(platform)) {
      return 'Linux';
    }

    return undefined;
  };

  React.useEffect(() => {
    const preOS = getOS();
    if (os !== preOS) setOS(preOS);
  }, []);

  return os;
};

export default useOS;
