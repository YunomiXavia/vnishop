import React from "react";

export interface TextAreaProductProps {
  name: string;
  label: string;
  placeholder: string;
  type?: string;
  required?: boolean;
  validation?: Record<string, any>;
  disabled?: boolean;
  children?: React.ReactNode;
}
