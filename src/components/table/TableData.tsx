import React from "react";
import { TableDataProps } from "@/types/component/table/table";

function TableData<T extends { id: string }>({
  columns,
  data,
  onRowClick,
  selectedRowIds = [],
  rowKey = "id",
}: TableDataProps<T>) {
  return (
    <div className="overflow-x-auto transition-opacity duration-500 ease-in-out border rounded-lg shadow-sm mb-6">
      <table className="min-w-full bg-white border rounded-lg shadow-sm">
        <thead>
          <tr className="bg-gray-200 text-gray-700">
            {columns.map((col, i) => (
              <th key={i} className="px-4 py-2 text-center">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((item) => {
              const isSelected = selectedRowIds.includes(
                item[rowKey] as unknown as string
              );
              return (
                <tr
                  key={item[rowKey] as unknown as string}
                  className={`hover:bg-gray-50 transition ease-in-out duration-200 cursor-pointer ${
                    isSelected ? "bg-indigo-100" : ""
                  }`}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((col, ci) => (
                    <td key={ci} className="border px-4 py-2 text-center">
                      {col.render
                        ? col.render(item)
                        : col.accessor
                        ? (item[col.accessor] as React.ReactNode)
                        : null}
                    </td>
                  ))}
                </tr>
              );
            })
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center py-4 text-gray-500"
              >
                Không có dữ liệu
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default TableData;
