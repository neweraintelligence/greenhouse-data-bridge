import { useState, useCallback } from 'react';
import {
  generateDemoEmail,
  analyzeDocument,
  validateExtraction,
  type EmailGenerationResult,
  type DocumentAnalysisResult,
} from './geminiService';

interface UseGeminiEmailResult {
  email: EmailGenerationResult | null;
  isLoading: boolean;
  error: string | null;
  generate: (context: { useCase: string; vendor: string; shipmentId?: string }) => Promise<void>;
}

export function useGeminiEmail(): UseGeminiEmailResult {
  const [email, setEmail] = useState<EmailGenerationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (context: {
    useCase: string;
    vendor: string;
    shipmentId?: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await generateDemoEmail(context);
      setEmail(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate email');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { email, isLoading, error, generate };
}

interface UseDocumentAnalysisResult {
  result: DocumentAnalysisResult | null;
  validation: {
    valid: boolean;
    missingFields: string[];
    lowConfidenceFields: string[];
  } | null;
  isAnalyzing: boolean;
  error: string | null;
  analyze: (
    imageData: string,
    documentType: 'bol' | 'training_form' | 'incident_report',
    requiredFields?: string[]
  ) => Promise<DocumentAnalysisResult | null>;
  clear: () => void;
}

export function useDocumentAnalysis(): UseDocumentAnalysisResult {
  const [result, setResult] = useState<DocumentAnalysisResult | null>(null);
  const [validation, setValidation] = useState<{
    valid: boolean;
    missingFields: string[];
    lowConfidenceFields: string[];
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (
    imageData: string,
    documentType: 'bol' | 'training_form' | 'incident_report',
    requiredFields?: string[]
  ): Promise<DocumentAnalysisResult | null> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const analysisResult = await analyzeDocument(imageData, documentType);
      setResult(analysisResult);

      if (requiredFields) {
        const validationResult = validateExtraction(analysisResult, requiredFields);
        setValidation(validationResult);
      }

      return analysisResult;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze document');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    setValidation(null);
    setError(null);
  }, []);

  return { result, validation, isAnalyzing, error, analyze, clear };
}

// Helper to convert File to base64
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
