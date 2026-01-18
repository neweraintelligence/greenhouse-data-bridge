import { memo, useState } from 'react';
import {
  Folder,
  FileText,
  FileSpreadsheet,
  Image,
  ChevronRight,
  Check,
} from 'lucide-react';

export interface FileItem {
  id: string;
  name: string;
  type: 'folder' | 'pdf' | 'excel' | 'image' | 'doc';
  size?: string;
  modified?: string;
}

interface OneDriveMiniAppProps {
  files: FileItem[];
  currentPath?: string[];
  onFileClick?: (file: FileItem) => void;
  onSelect?: (file: FileItem) => void;
  selectedId?: string;
  isLoading?: boolean;
}

const iconMap = {
  folder: Folder,
  pdf: FileText,
  excel: FileSpreadsheet,
  image: Image,
  doc: FileText,
};

const iconColorMap = {
  folder: 'text-amber-500',
  pdf: 'text-red-500',
  excel: 'text-green-600',
  image: 'text-blue-500',
  doc: 'text-blue-600',
};

function OneDriveMiniAppComponent({
  files,
  currentPath = ['Documents'],
  onFileClick,
  onSelect,
  selectedId,
  isLoading,
}: OneDriveMiniAppProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Shimmer loading state
  if (isLoading) {
    return (
      <div className="space-y-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded bg-gray-100/50">
            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-28 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-2 px-1">
        {currentPath.map((segment, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="w-2.5 h-2.5" />}
            <span className={i === currentPath.length - 1 ? 'font-medium text-gray-700' : ''}>
              {segment}
            </span>
          </span>
        ))}
      </div>

      {/* File list */}
      <div className="space-y-0.5 max-h-[160px] overflow-y-auto scrollbar-thin">
        {files.map((file) => {
          const Icon = iconMap[file.type] || FileText;
          const iconColor = iconColorMap[file.type] || 'text-gray-500';
          const isSelected = selectedId === file.id;

          return (
            <div
              key={file.id}
              className={`
                file-item group
                ${isSelected ? 'file-item-selected' : ''}
                ${hoveredId === file.id && !isSelected ? 'bg-gray-50' : ''}
              `}
              onMouseEnter={() => setHoveredId(file.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onFileClick?.(file)}
              onDoubleClick={() => onSelect?.(file)}
            >
              <Icon className={`w-4 h-4 ${iconColor}`} />
              <span className="text-xs text-gray-700 truncate flex-1">{file.name}</span>

              {file.size && (
                <span className="text-[10px] text-gray-400 shrink-0">{file.size}</span>
              )}

              {isSelected && (
                <Check className="w-3.5 h-3.5 text-bmf-blue shrink-0" />
              )}

              {!isSelected && hoveredId === file.id && onSelect && file.type !== 'folder' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(file);
                  }}
                  className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-bmf-blue/10 text-bmf-blue hover:bg-bmf-blue/20"
                >
                  Select
                </button>
              )}
            </div>
          );
        })}

        {files.length === 0 && (
          <div className="text-center py-4">
            <Folder className="w-6 h-6 text-gray-300 mx-auto mb-1" />
            <p className="text-xs text-gray-400">Folder is empty</p>
          </div>
        )}
      </div>
    </div>
  );
}

export const OneDriveMiniApp = memo(OneDriveMiniAppComponent);
