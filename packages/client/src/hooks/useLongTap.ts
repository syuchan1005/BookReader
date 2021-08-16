import {
  TouchEvent as ReactTouchEvent,
  TouchEventHandler,
  useCallback,
  useEffect,
  useRef,
} from 'react';

function isTouchEvent(event: ReactTouchEvent): event is ReactTouchEvent {
  const { nativeEvent } = event;
  return window.TouchEvent ? nativeEvent instanceof TouchEvent : 'touches' in nativeEvent;
}

type Coordinates = {
  x: number;
  y: number;
} | null;

function getCurrentPosition(event: ReactTouchEvent): Coordinates {
  if (isTouchEvent(event)) {
    return {
      x: event.touches[0].pageX,
      y: event.touches[0].pageY,
    };
  }

  return null;
}

export type LongTapCallback = (event?: ReactTouchEvent) => void;

export type LongTapResult = {
  onTouchStart: TouchEventHandler;
  onTouchMove: TouchEventHandler;
  onTouchEnd: TouchEventHandler;
} | {};

export interface LongTapOptions {
  threshold?: number;
  moveThreshold?: number;
  onStart?: LongTapCallback;
  onMove?: LongTapCallback;
  onFinish?: LongTapCallback;
  onCancel?: LongTapCallback;
}

export function useLongTap(
  callback?: (e: ReactTouchEvent) => void,
  {
    threshold = 400,
    moveThreshold = 25,
    onStart,
    onMove,
    onFinish,
    onCancel,
  }: LongTapOptions = {},
): LongTapResult {
  const isLongTapActive = useRef(false);
  const isPressed = useRef(false);
  const timer = useRef<NodeJS.Timeout>();
  const savedCallback = useRef(callback);
  const startPosition = useRef<Coordinates>(null);

  const start = useCallback(
    (event: ReactTouchEvent) => {
      if (isPressed.current) {
        return;
      }

      if (!isTouchEvent(event)) {
        return;
      }

      startPosition.current = getCurrentPosition(event);

      event.persist();

      onStart?.(event);
      isPressed.current = true;
      timer.current = setTimeout(() => {
        if (savedCallback.current) {
          savedCallback.current(event);
          isLongTapActive.current = true;
        }
      }, threshold);
    },
    [onStart, threshold],
  );

  const cancel = useCallback(
    (event: ReactTouchEvent) => {
      if (!isTouchEvent(event)) {
        return;
      }

      startPosition.current = null;

      event.persist();

      if (isLongTapActive.current) {
        onFinish?.(event);
      } else if (isPressed.current) {
        onCancel?.(event);
      }
      isLongTapActive.current = false;
      isPressed.current = false;
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    [onFinish, onCancel],
  );

  const handleMove = useCallback(
    (event: ReactTouchEvent) => {
      onMove?.(event);
      if (startPosition.current) {
        const currentPosition = getCurrentPosition(event);
        if (currentPosition) {
          const movedDistance = {
            x: Math.abs(currentPosition.x - startPosition.current.x),
            y: Math.abs(currentPosition.y - startPosition.current.y),
          };

          if (movedDistance.x > moveThreshold || movedDistance.y > moveThreshold) {
            cancel(event);
          }
        }
      }
    },
    [cancel, onMove, moveThreshold],
  );

  useEffect(
    () => (): void => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    [],
  );

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  if (!callback) {
    return {};
  }

  return {
    onTouchStart: start as TouchEventHandler,
    onTouchMove: handleMove as TouchEventHandler,
    onTouchEnd: cancel as TouchEventHandler,
  };
}
