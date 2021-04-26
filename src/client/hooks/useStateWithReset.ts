import { useCallback, useState } from "react";

const useStateWithReset = <T>(initValue: T): [T, (T) => void, () => void] => {
    const [state, setState] = useState(initValue);
    const reset = useCallback(() => {
        setState(initValue);
    }, []);
    const setValue = useCallback((setFunc: (initValue: T, prevValue: T) => T) => {
        setState((prevValue: T) => setFunc(initValue, prevValue));
    }, []);

    return [state, setValue, reset];
};

export default useStateWithReset;