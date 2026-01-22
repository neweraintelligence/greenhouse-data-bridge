import { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { ChevronDown, Truck, AlertTriangle, Check, ShieldCheck, BookOpen, Building2, ShoppingCart, ClipboardCheck, Wrench, DollarSign, UserPlus, Zap, Play, Pencil } from 'lucide-react';
import type { UseCase } from '../../../lib/useCases/types';

const useCaseIcons: Record<string, typeof Truck> = {
  shipping: Truck,
  incidents: AlertTriangle,
  quality: ShieldCheck,
  supplier_management: Building2,
  customer_orders: ShoppingCart,
  regulatory_compliance: ClipboardCheck,
  equipment_maintenance: Wrench,
  accounts_payable: DollarSign,
  hr_training: UserPlus,
};

// Badge configuration for different use case types
type BadgeType = 'live' | 'demo' | 'template';
const useCaseBadges: Record<string, BadgeType> = {
  shipping: 'live',
  incidents: 'demo',
  supplier_management: 'template',
  customer_orders: 'template',
  regulatory_compliance: 'template',
  equipment_maintenance: 'template',
  accounts_payable: 'template',
  hr_training: 'template',
};

const badgeConfig: Record<BadgeType, { label: string; icon: typeof Zap; bgColor: string; textColor: string; borderStyle?: string }> = {
  live: { label: 'Live', icon: Zap, bgColor: 'bg-emerald-100', textColor: 'text-emerald-700' },
  demo: { label: 'Demo', icon: Play, bgColor: 'bg-amber-100', textColor: 'text-amber-700' },
  template: { label: 'Build', icon: Pencil, bgColor: 'bg-purple-100', textColor: 'text-purple-700', borderStyle: 'border border-dashed border-purple-300' },
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
                const badgeType = useCaseBadges[data.selectedUseCase!.id];
                const isTemplate = badgeType === 'template';

                return (
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isTemplate
                      ? 'bg-purple-100 border border-dashed border-purple-300'
                      : badgeType === 'live'
                        ? 'bg-emerald-100'
                        : badgeType === 'demo'
                          ? 'bg-amber-100'
                          : 'bg-bmf-blue/10'
                  }`}>
                    <Icon className={`w-4 h-4 ${
                      isTemplate
                        ? 'text-purple-600'
                        : badgeType === 'live'
                          ? 'text-emerald-600'
                          : badgeType === 'demo'
                            ? 'text-amber-600'
                            : 'text-bmf-blue'
                    }`} />
                  </div>
                );
              })()}
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-800">
                    {data.selectedUseCase!.name}
                  </p>
                  {(() => {
                    const badgeType = useCaseBadges[data.selectedUseCase!.id];
                    if (!badgeType) return null;
                    const badge = badgeConfig[badgeType];
                    return (
                      <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${badge.bgColor} ${badge.textColor} ${badge.borderStyle || ''}`}>
                        {badge.label}
                      </span>
                    );
                  })()}
                </div>
                <p className="text-xs text-gray-500">
                  {useCaseBadges[data.selectedUseCase!.id] === 'template' ? 'Template Selected' : 'Use Case Selected'}
                </p>
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

          {/* Live Demos Section */}
          {data.useCases.some(uc => useCaseBadges[uc.id] === 'live') && (
            <>
              <div className="px-3 py-2 bg-emerald-50 border-b border-emerald-100">
                <div className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-emerald-600" />
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Live Demo</p>
                </div>
              </div>
              {data.useCases.filter(uc => useCaseBadges[uc.id] === 'live').map((useCase) => {
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
                      px-4 py-3 cursor-pointer transition-colors border-b border-gray-100
                      ${isSelected ? 'bg-emerald-50' : 'hover:bg-gray-50'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-emerald-200' : 'bg-emerald-100'
                      }`}>
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-700' : 'text-emerald-600'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${isSelected ? 'text-emerald-700' : 'text-gray-800'}`}>
                            {useCase.name}
                          </p>
                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-emerald-100 text-emerald-700 rounded">
                            Live
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {useCase.description}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Demo Section */}
          {data.useCases.some(uc => useCaseBadges[uc.id] === 'demo') && (
            <>
              <div className="px-3 py-2 bg-amber-50 border-b border-amber-100">
                <div className="flex items-center gap-2">
                  <Play className="w-3 h-3 text-amber-600" />
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Demo</p>
                </div>
              </div>
              {data.useCases.filter(uc => useCaseBadges[uc.id] === 'demo').map((useCase) => {
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
                      px-4 py-3 cursor-pointer transition-colors border-b border-gray-100
                      ${isSelected ? 'bg-amber-50' : 'hover:bg-gray-50'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-amber-200' : 'bg-amber-100'
                      }`}>
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-700' : 'text-amber-600'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${isSelected ? 'text-amber-700' : 'text-gray-800'}`}>
                            {useCase.name}
                          </p>
                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded">
                            Demo
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {useCase.description}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-amber-600" />
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Build Your Own Section */}
          {data.useCases.some(uc => useCaseBadges[uc.id] === 'template') && (
            <>
              <div className="px-3 py-2 bg-purple-50 border-b border-purple-100">
                <div className="flex items-center gap-2">
                  <Pencil className="w-3 h-3 text-purple-600" />
                  <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Build Your Own</p>
                </div>
              </div>
              {data.useCases.filter(uc => useCaseBadges[uc.id] === 'template').map((useCase) => {
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
                      ${isSelected ? 'bg-purple-50' : 'hover:bg-gray-50'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border border-dashed ${
                        isSelected ? 'bg-purple-100 border-purple-400' : 'bg-purple-50 border-purple-300'
                      }`}>
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-purple-700' : 'text-purple-500'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${isSelected ? 'text-purple-700' : 'text-gray-800'}`}>
                            {useCase.name}
                          </p>
                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-purple-100 text-purple-700 rounded border border-dashed border-purple-300">
                            Build
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {useCase.description}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-purple-600" />
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export const UseCaseSelectorNode = memo(UseCaseSelectorNodeComponent);
