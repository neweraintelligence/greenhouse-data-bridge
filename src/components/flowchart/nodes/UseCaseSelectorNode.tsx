import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ChevronDown, Truck, AlertTriangle, Check, ShieldCheck, BookOpen } from 'lucide-react';
import type { UseCase } from '../../../lib/useCases/types';

const useCaseIcons: Record<string, typeof Truck> = {
  shipping: Truck,
  incidents: AlertTriangle,
  quality: ShieldCheck,
};

// Special "Theory" section type
export type SectionSelection = UseCase | { id: 'theory'; name: string; description: string };

export interface UseCaseSelectorNodeData {
  useCases: UseCase[];
  selectedUseCase: UseCase | null;
  selectedSection: SectionSelection | null;
  onSelect: (useCase: UseCase) => void;
  onSelectTheory?: () => void;
  isTheoryMode?: boolean;
}

interface UseCaseSelectorNodeProps {
  data: UseCaseSelectorNodeData;
}

const theorySection = {
  id: 'theory' as const,
  name: 'Document Processing AI',
  description: 'Learn how intelligent document processing transforms data into insights',
};

function UseCaseSelectorNodeComponent({ data }: UseCaseSelectorNodeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasSelection = data.selectedUseCase !== null || data.isTheoryMode;
  const isTheorySelected = data.isTheoryMode;

  const handleSelect = (useCase: UseCase) => {
    data.onSelect(useCase);
    setIsOpen(false);
  };

  const handleSelectTheory = () => {
    data.onSelectTheory?.();
    setIsOpen(false);
  };

  return (
    <div className="min-w-[240px]">
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-white !border-2 !border-bmf-blue !w-3 !h-3"
      />

      {/* Section Header */}
      <div className="mb-2 px-1">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Sections
        </h3>
      </div>

      {/* Selector - always visible */}
      <div
        className={`
          px-4 py-3 rounded-xl cursor-pointer transition-all
          ${hasSelection
            ? 'bg-white border-2 border-bmf-blue shadow-md'
            : 'bg-white border-2 border-dashed border-gray-300 hover:border-bmf-blue/50'
          }
        `}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          {isTheorySelected ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {theorySection.name}
                </p>
                <p className="text-xs text-gray-500">Theory Section</p>
              </div>
            </div>
          ) : data.selectedUseCase ? (
            <div className="flex items-center gap-3">
              {(() => {
                const Icon = useCaseIcons[data.selectedUseCase!.id] || AlertTriangle;
                return (
                  <div className="w-8 h-8 rounded-lg bg-bmf-blue/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-bmf-blue" />
                  </div>
                );
              })()}
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {data.selectedUseCase!.name}
                </p>
                <p className="text-xs text-gray-500">Use Case Selected</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <span className="text-lg">📋</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Select Section</p>
                <p className="text-xs text-gray-400">Click to choose</p>
              </div>
            </div>
          )}
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="mt-2 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          {/* Theory Section */}
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Theory</p>
          </div>
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleSelectTheory();
            }}
            className={`
              px-4 py-3 cursor-pointer transition-colors border-b border-gray-200
              ${isTheorySelected ? 'bg-purple-50' : 'hover:bg-gray-50'}
            `}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isTheorySelected ? 'bg-purple-200' : 'bg-gray-100'
              }`}>
                <BookOpen className={`w-4 h-4 ${isTheorySelected ? 'text-purple-600' : 'text-gray-500'}`} />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${isTheorySelected ? 'text-purple-700' : 'text-gray-800'}`}>
                  {theorySection.name}
                </p>
                <p className="text-xs text-gray-500 line-clamp-1">
                  {theorySection.description}
                </p>
              </div>
              {isTheorySelected && (
                <Check className="w-4 h-4 text-purple-600" />
              )}
            </div>
          </div>

          {/* Use Cases Section */}
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Use Cases</p>
          </div>
          {data.useCases.map((useCase) => {
            const Icon = useCaseIcons[useCase.id] || AlertTriangle;
            const isSelected = data.selectedUseCase?.id === useCase.id && !isTheorySelected;

            return (
              <div
                key={useCase.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(useCase);
                }}
                className={`
                  px-4 py-3 cursor-pointer transition-colors border-b border-gray-100 last:border-0
                  ${isSelected ? 'bg-bmf-blue/5' : 'hover:bg-gray-50'}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-bmf-blue/20' : 'bg-gray-100'
                  }`}>
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-bmf-blue' : 'text-gray-500'}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isSelected ? 'text-bmf-blue' : 'text-gray-800'}`}>
                      {useCase.name}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-1">
                      {useCase.description}
                    </p>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-bmf-blue" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const UseCaseSelectorNode = memo(UseCaseSelectorNodeComponent);
