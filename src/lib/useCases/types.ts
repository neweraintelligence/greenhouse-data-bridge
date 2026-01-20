export interface SourceConfig {
  type: 'outlook' | 'onedrive' | 'excel' | 'paper' | 'barcode' | 'camera' | 'ai';
  name: string;
  icon: string;
  description?: string;
  optional?: boolean;
}

export interface OutputTemplate {
  id: string;
  name: string;
  fileType: 'pdf' | 'csv';
  description: string;
}

export interface QueryConfig {
  id: string;
  name: string;
  description: string;
}

export interface UseCase {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  sources: SourceConfig[];
  outputTemplates: OutputTemplate[];
  dashboardQueries: QueryConfig[];
}

// Registry type
export type UseCaseRegistry = Map<string, UseCase>;
