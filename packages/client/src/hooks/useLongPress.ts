import { useCallback, useRef, useState } from 'react';

interface Options {
  isPreventDefault?: boolean;
  delay?: number;
}

const isTouchEvent = (ev: Event): ev is TouchEvent => 'touches' in ev;

const preventDefault = (ev: Event) => {
  if (!isTouchEvent(ev)) return;

  if (ev.touches.length < 2 && ev.preventDefault) {
    ev.preventDefault();
  }
};

/**
 * @param onLongPress Returns click available state.
 * @param onClick
 * @param options
 */
const useLongPress = (
  onLongPress: (e: TouchEvent | MouseEvent) => boolean,
  onClick: () => void,
  {
    isPreventDefault = true,
    delay = 300,
  }: Options = {},
) => {
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout>>();
  const target = useRef<EventTarget>();

  const start = useCallback(
    (event: TouchEvent | MouseEvent) => {
      // prevent ghost click on mobile devices
      if (isPreventDefault && event.target) {
        event.target.addEventListener('touchend', preventDefault, { passive: false });
        target.current = event.target;
      }
      timeout.current = setTimeout(() => {
        setLongPressTriggered(onLongPress(event));
      }, delay);
    },
    [onLongPress, delay, isPreventDefault],
  );

  const clear = useCallback((_event) => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
    setLongPressTriggered(false);
    if (isPreventDefault && target.current) {
      target.current.removeEventListener('touchend', preventDefault);
    }
  }, [isPreventDefault]);

  const handleClick = useCallback((e: any) => {
    if (!longPressTriggered) {
      onClick();
    }
    clear(e);
  }, [longPressTriggered, clear, onClick]);

  return {
    onMouseDown: (e: any) => start(e),
    onTouchStart: (e: any) => start(e),
    onMouseLeave: clear,
    onMouseUp: clear,
    onTouchEnd: clear,
    onClick: handleClick,
  } as const;
};

export default useLongPress;
