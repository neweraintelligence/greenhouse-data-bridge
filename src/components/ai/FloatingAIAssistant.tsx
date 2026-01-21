import { memo, useState, useRef, useEffect } from 'react';
import { X, MessageSquare, Mail, FileCheck, AlertTriangle, Loader2, ChevronUp, FileText } from 'lucide-react';
import { chat, queryCanadaGAPCompliance, type ChatMessage, type ChatContext, type ChatResponse } from '../../lib/ai/geminiService';
import type { ReconciliationReport } from '../../lib/ai/reportGenerator';

interface FloatingAIAssistantProps {
  context: ChatContext;
  reconciliationReport?: ReconciliationReport | null;
}

function FloatingAIAssistantComponent({ context, reconciliationReport }: FloatingAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<ChatResponse | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setIsLoading(true);

    try {
      // Check if it's a compliance question
      const isComplianceQuestion =
        input.toLowerCase().includes('canadagap') ||
        input.toLowerCase().includes('compliance') ||
        input.toLowerCase().includes('section') ||
        input.toLowerCase().includes('requirement');

      let response: ChatResponse;

      // Build enhanced context with report data
      const enhancedContext = {
        ...context,
        reportData: reconciliationReport ? {
          summary: reconciliationReport.executiveSummary,
          statistics: reconciliationReport.statistics,
          discrepancies: reconciliationReport.discrepancyDetails,
          recommendations: reconciliationReport.recommendations,
        } : undefined,
      };

      if (isComplianceQuestion && context.useCase === 'quality') {
        const complianceResult = await queryCanadaGAPCompliance(input, {
          documentData: context.extractedData as Record<string, string>,
        });

        response = {
          message: `**Compliance Analysis:**\n\n${complianceResult.answer}\n\n**Status:** ${complianceResult.compliant === 'yes' ? '✅ Compliant' : complianceResult.compliant === 'no' ? '❌ Non-compliant' : complianceResult.compliant === 'partial' ? '⚠️ Partially Compliant' : '❓ Unable to determine'}\n\n**Relevant Sections:**\n${complianceResult.sections.map(s => `• Section ${s.sectionNumber}: ${s.title}`).join('\n')}\n\n**Recommendations:**\n${complianceResult.recommendations.map(r => `• ${r}`).join('\n')}`,
          suggestedActions: [
            { label: 'Generate compliance report', action: 'generate_compliance_report' },
            { label: 'Draft supplier inquiry', action: 'draft_supplier_email' },
          ],
        };
      } else {
        response = await chat(input, messages, enhancedContext);
      }

      setLastResponse(response);

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: "I'm having trouble processing that. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (action: string) => {
    const actionPrompts: Record<string, string> = {
      summarize: 'Summarize the reconciliation results and highlight any issues.',
      check_compliance: 'Does the COA we processed meet CanadaGAP Section 4.3.2 requirements?',
      draft_supplier_email: 'Draft an email to the supplier about the discrepancies found.',
      view_discrepancies: 'List all discrepancies found and their severity.',
      generate_audit_report: 'What do I need to have ready for a CanadaGAP audit?',
      draft_escalation: 'Draft an internal email escalating the critical issues.',
      generate_compliance_report: 'Generate a compliance summary for this receiving batch.',
      explain_report: 'Walk me through the key findings in this report.',
    };

    if (actionPrompts[action]) {
      setInput(actionPrompts[action]);
      setTimeout(() => handleSend(), 100);
    }
  };

  // Get use case label
  const useCaseLabel = context.useCase === 'quality' ? 'Quality & Compliance' :
    context.useCase === 'shipping' ? 'Shipping & Receiving' :
    context.useCase === 'incidents' ? 'Incident Management' :
    context.useCase === 'customer-orders' ? 'Customer Orders' : 'Document Analysis';

  return (
    <>
      {/* Floating Action Button - Modern pill design */}
      <button
        onClick={() => setIsOpen(true)}
        className={`
          fixed bottom-6 right-6 z-[9999]
          px-4 py-3 rounded-full
          bg-nei-green hover:bg-nei-green-light
          text-white shadow-lg
          flex items-center gap-2
          hover:shadow-xl hover:scale-105
          transition-all duration-200
          ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}
        `}
        title="Ask about this report"
      >
        <MessageSquare className="w-5 h-5" />
        <span className="text-sm font-medium">Ask AI</span>
      </button>

      {/* Chat Modal - Modern flat design */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[10000] w-[400px] h-[560px] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header - Clean with BMF blue accent line */}
          <div className="relative bg-white border-b border-gray-100">
            {/* Accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-bmf-blue via-bmf-blue to-nei-green" />

            <div className="px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-nei-green/10 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-nei-green" />
                </div>
                <div>
                  <h3 className="text-gray-900 font-semibold text-sm">Report Assistant</h3>
                  <p className="text-gray-400 text-xs">{useCaseLabel}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Messages Area - Clean white background */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-gray-50/50">
            {messages.length === 0 && (
              <div className="h-full flex flex-col justify-center">
                {/* Welcome state */}
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-bmf-blue/10 to-nei-green/10 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-6 h-6 text-nei-green" />
                  </div>
                  <h4 className="text-gray-800 font-medium mb-1">Ask about your report</h4>
                  <p className="text-gray-400 text-sm">
                    I can explain findings, draft emails, or answer questions
                  </p>
                </div>

                {/* Quick Start Buttons - Modern cards */}
                <div className="space-y-2">
                  <button
                    onClick={() => handleQuickAction('explain_report')}
                    className="w-full px-4 py-3 text-left bg-white rounded-xl border border-gray-100 hover:border-bmf-blue/30 hover:shadow-sm transition-all flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-bmf-blue/10 flex items-center justify-center group-hover:bg-bmf-blue/20 transition-colors">
                      <FileCheck className="w-4 h-4 text-bmf-blue" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-800 font-medium">Explain key findings</p>
                      <p className="text-xs text-gray-400">Walk through the report results</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleQuickAction('view_discrepancies')}
                    className="w-full px-4 py-3 text-left bg-white rounded-xl border border-gray-100 hover:border-amber-300 hover:shadow-sm transition-all flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-800 font-medium">List all discrepancies</p>
                      <p className="text-xs text-gray-400">Review flagged items by severity</p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleQuickAction('draft_escalation')}
                    className="w-full px-4 py-3 text-left bg-white rounded-xl border border-gray-100 hover:border-nei-green/30 hover:shadow-sm transition-all flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-nei-green/10 flex items-center justify-center group-hover:bg-nei-green/20 transition-colors">
                      <Mail className="w-4 h-4 text-nei-green" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-800 font-medium">Draft escalation email</p>
                      <p className="text-xs text-gray-400">Notify stakeholders of issues</p>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`
                    max-w-[85%] rounded-2xl px-4 py-3
                    ${msg.role === 'user'
                      ? 'bg-bmf-blue text-white'
                      : 'bg-white text-gray-700 border border-gray-100 shadow-sm'
                    }
                  `}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  <p className={`text-[10px] mt-2 ${msg.role === 'user' ? 'text-white/50' : 'text-gray-300'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {/* Loading state */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-700 border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-nei-green/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-nei-green/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-nei-green/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Suggested Actions */}
            {lastResponse?.suggestedActions && lastResponse.suggestedActions.length > 0 && !isLoading && (
              <div className="flex flex-wrap gap-2 pt-1">
                {lastResponse.suggestedActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickAction(action.action)}
                    className="px-3 py-1.5 text-xs bg-white border border-gray-200 text-gray-600 rounded-lg hover:border-bmf-blue hover:text-bmf-blue transition-all"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}

            {/* Draft Email Preview */}
            {lastResponse?.draftEmail && !isLoading && (
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                  <Mail className="w-4 h-4 text-nei-green" />
                  <span className="text-xs font-medium text-gray-700">Draft Email</span>
                </div>
                <div className="text-xs space-y-2">
                  <p className="text-gray-500"><span className="text-gray-400">To:</span> {lastResponse.draftEmail.to}</p>
                  <p className="text-gray-500"><span className="text-gray-400">Subject:</span> {lastResponse.draftEmail.subject}</p>
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg text-gray-600 whitespace-pre-wrap leading-relaxed">
                    {lastResponse.draftEmail.body}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button className="flex-1 px-3 py-2 text-xs bg-bmf-blue text-white rounded-lg hover:bg-bmf-blue-dark transition-colors font-medium">
                    Copy to Clipboard
                  </button>
                  <button className="px-3 py-2 text-xs border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors">
                    Edit
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area - Modern minimal design */}
          <div className="p-4 border-t border-gray-100 bg-white">
            <div className="flex items-end gap-2 bg-gray-50 rounded-xl p-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  adjustTextareaHeight();
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question..."
                rows={1}
                className="flex-1 px-3 py-2 bg-transparent text-sm resize-none focus:outline-none text-gray-700 placeholder-gray-400"
                style={{ maxHeight: '120px' }}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="w-9 h-9 rounded-lg bg-nei-green text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-nei-green-light transition-colors flex-shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="flex items-center justify-center gap-2 mt-3">
              <img src="/bmf-logo.png" alt="BMF" className="h-4 opacity-40" />
              <span className="text-[10px] text-gray-300">×</span>
              <img src="/nei-logo.png" alt="NEI" className="h-4 opacity-40" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export const FloatingAIAssistant = memo(FloatingAIAssistantComponent);
