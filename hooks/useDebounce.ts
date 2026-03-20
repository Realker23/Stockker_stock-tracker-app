import { useCallback, useEffect, useRef } from "react";

/**
 * Debounces a callback function by the given delay in milliseconds.
 * The callback is only invoked after the delay has passed since the last call.
 *
 * @param callback - The function to debounce.
 * @param delay - Debounce delay in milliseconds.
 * @returns A stable debounced version of the callback.
 */
export function useDebounce(callback: () => void, delay: number): () => void {
    
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    return useCallback(() => {
       if(timeoutRef.current) {
           clearTimeout(timeoutRef.current);
       }
       timeoutRef.current = setTimeout(() => {
           callback();
       }, delay);
    }, [callback, delay]);
}