import { memo } from 'react';

export interface SpreadsheetData {
  headers: string[];
  rows: (string | number)[][];
  sheetName?: string;
}

interface ExcelMiniAppProps {
  data: SpreadsheetData;
  highlightRows?: number[];
  isLoading?: boolean;
}

function ExcelMiniAppComponent({ data, highlightRows = [], isLoading }: ExcelMiniAppProps) {
  // Shimmer loading state
  if (isLoading) {
    return (
      <div className="space-y-1">
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-1">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  const columnLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  return (
    <div>
      {/* Sheet tab */}
      {data.sheetName && (
        <div className="flex items-center gap-1 mb-1.5">
          <div className="text-[10px] px-2 py-0.5 bg-white border border-gray-200 rounded-t border-b-0 font-medium text-gray-700">
            {data.sheetName}
          </div>
        </div>
      )}

      {/* Spreadsheet grid */}
      <div className="border border-gray-200 rounded overflow-hidden">
        <div className="overflow-x-auto max-h-[140px] overflow-y-auto scrollbar-thin">
          <table className="w-full text-[10px]">
            {/* Column headers (A, B, C...) */}
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-100">
                <th className="spreadsheet-cell spreadsheet-header w-6 text-gray-400">#</th>
                {data.headers.map((_, colIndex) => (
                  <th key={colIndex} className="spreadsheet-cell spreadsheet-header text-gray-500">
                    {columnLetters[colIndex] || `C${colIndex + 1}`}
                  </th>
                ))}
              </tr>
              {/* Data headers */}
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                <th className="spreadsheet-cell text-gray-400">1</th>
                {data.headers.map((header, colIndex) => (
                  <th key={colIndex} className="spreadsheet-cell font-semibold text-gray-700 text-left">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, rowIndex) => {
                const isHighlighted = highlightRows.includes(rowIndex);
                return (
                  <tr
                    key={rowIndex}
                    className={isHighlighted ? 'bg-amber-50' : rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                  >
                    <td className="spreadsheet-cell text-gray-400 bg-gray-50">
                      {rowIndex + 2}
                    </td>
                    {row.map((cell, colIndex) => (
                      <td
                        key={colIndex}
                        contentEditable
                        suppressContentEditableWarning
                        className={`spreadsheet-cell cursor-text ${
                          typeof cell === 'number' ? 'text-right font-mono' : ''
                        } ${isHighlighted ? 'font-medium' : ''} hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400/50`}
                        onKeyDown={(e) => {
                          // Allow normal text editing keys
                          if (e.key === 'Escape') {
                            e.currentTarget.blur();
                          }
                        }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row count */}
      <div className="flex items-center justify-between mt-1.5 px-1">
        <span className="text-[10px] text-gray-400">
          {data.rows.length} rows
        </span>
        {highlightRows.length > 0 && (
          <span className="text-[10px] text-amber-600">
            {highlightRows.length} flagged
          </span>
        )}
      </div>
    </div>
  );
}

export const ExcelMiniApp = memo(ExcelMiniAppComponent);
