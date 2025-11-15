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
  const [displayValue, setDisplayValue] = useState(initialValue);
  const isComposing = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCompositionStart = useCallback(() => {
    isComposing.current = true;
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleCompositionEnd = useCallback((e: React.CompositionEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    isComposing.current = false;
    const newValue = (e.target as HTMLInputElement | HTMLTextAreaElement).value;
    setDisplayValue(newValue);
    setValue(newValue);
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setDisplayValue(newValue);
    
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Update state immediately if not composing
    if (!isComposing.current) {
      setValue(newValue);
    } else {
      // Debounce update during composition to prevent timeout
      timeoutRef.current = setTimeout(() => {
        setValue(newValue);
      }, 100);
    }
  }, []);

  // Method to programmatically set value (e.g., when loading data)
  const reset = useCallback((newValue: string) => {
    setValue(newValue);
    setDisplayValue(newValue);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return {
    value,
    reset,
    props: {
      value: displayValue,
      onChange: handleChange,
      onCompositionStart: handleCompositionStart,
      onCompositionEnd: handleCompositionEnd,
    },
  };
}
