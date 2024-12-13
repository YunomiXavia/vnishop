import React from "react";

export interface Column<T> {
  header: string;
  accessor?: keyof T;
  render?: (item: T) => React.ReactNode;
}

export interface TableDataProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  selectedRowIds?: string[];
  rowKey?: keyof T;
}
