import React from 'react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'style' | 'value' | 'defaultValue' | 'onChange'> {
  label?: string;
  /** Helper text below the field. */
  hint?: string;
  /** Error message — switches border + helper to error color. */
  error?: string;
  required?: boolean;
  /** Leading icon element. */
  iconLeft?: React.ReactNode;
  /** Render a multi-line <textarea> (job posting, Anschreiben). */
  multiline?: boolean;
  /** Switch the value to the reading-serif document voice. */
  serif?: boolean;
  /** Textarea rows when multiline. */
  rows?: number;
  maxLength?: number;
  /** Show a right-aligned "128 / 2.000" character counter (de-DE formatting). */
  showCounter?: boolean;
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  style?: React.CSSProperties;
}

/**
 * Text / textarea field on warm canvas; the 2px deep-green focus ring is the activation signal.
 * `serif` + `multiline` give the Anschreiben document field; `showCounter` adds the char counter.
 */
export function Input(props: InputProps): JSX.Element;
