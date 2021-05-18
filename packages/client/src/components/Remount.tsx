import {
  FC,
  ReactNode,
  useEffect,
  useState,
  memo,
} from 'react';

type RemountProps = {
  remount: boolean;
  children?: ReactNode;
};

// @ts-ignore
// eslint-disable-next-line import/prefer-default-export
export const Remount: FC<RemountProps> = memo((props: RemountProps) => {
  const [remount, setRemount] = useState(false);
  useEffect(() => {
    if (!props.remount) return;
    setRemount(true);
    setTimeout(() => {
      setRemount(false);
    }, 1);
  }, [props.remount]);

  return remount ? null : props.children;
});
