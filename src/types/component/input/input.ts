// Input Text Props interface for InputTextAuth
import React from "react";

export interface InputTextProps {
  name: string;
  label: string;
  placeholder: string;
  type?: string;
  required?: boolean;
  validation?: Record<string, any>;
  disabled?: boolean;
}

export interface InputTextProductProps {
  name: string;
  label: string;
  placeholder: string;
  type?: string;
  required?: boolean;
  validation?: Record<string, any>;
  disabled?: boolean;
  children?: React.ReactNode;
}