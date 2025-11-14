import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for handling Thai text input with composition events
 * Prevents input timeout issues when typing Thai characters
 * 
 * Usage:
 * const titleInput = useThaiTextInput(initialValue);
 * <Input {...titleInput.props} />
 * // Access current value with titleInput.value
 */
export function useThaiTextInput(initialValue: string = '') {
  const [value, setValue] = useState(initialValue);
  const isComposing = useRef(false);
  const pendingValue = useRef(initialValue);

  const handleCompositionStart = useCallback(() => {
    isComposing.current = true;
  }, []);

  const handleCompositionEnd = useCallback((e: React.CompositionEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    isComposing.current = false;
    const newValue = (e.target as HTMLInputElement | HTMLTextAreaElement).value;
    pendingValue.current = newValue;
    setValue(newValue);
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    pendingValue.current = newValue;
    
    // Only update state immediately if not composing
    if (!isComposing.current) {
      setValue(newValue);
    }
  }, []);

  // Method to programmatically set value (e.g., when loading data)
  const reset = useCallback((newValue: string) => {
    setValue(newValue);
    pendingValue.current = newValue;
  }, []);

  return {
    value,
    reset,
    props: {
      value: pendingValue.current,
      onChange: handleChange,
      onCompositionStart: handleCompositionStart,
      onCompositionEnd: handleCompositionEnd,
    },
  };
}
