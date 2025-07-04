import { useState, useEffect } from "react";

/**
 * Hook personalizado para debounce
 * @param value - Valor a debounce
 * @param delay - Delay en milisegundos
 * @returns Valor debounceado
 */
export const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
