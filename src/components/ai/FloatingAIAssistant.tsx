import { memo, useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Mail, FileCheck, AlertTriangle, Loader2 } from 'lucide-react';
import { chat, queryCanadaGAPCompliance, type ChatMessage, type ChatContext, type ChatResponse } from '../../lib/ai/geminiService';

interface FloatingAIAssistantProps {
  context: ChatContext;
}

function FloatingAIAssistantComponent({ context }: FloatingAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<ChatResponse | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Check if it's a compliance question
      const isComplianceQuestion =
        input.toLowerCase().includes('canadagap') ||
        input.toLowerCase().includes('compliance') ||
        input.toLowerCase().includes('section') ||
        input.toLowerCase().includes('requirement');

      let response: ChatResponse;

      if (isComplianceQuestion && context.useCase === 'quality') {
        // Use dedicated compliance query
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
        response = await chat(input, messages, context);
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (action: string) => {
    const actionPrompts: Record<string, string> = {
      summarize: 'Summarize what we processed today and highlight any issues.',
      check_compliance: 'Does the COA we processed meet CanadaGAP Section 4.3.2 requirements?',
      draft_supplier_email: 'Draft an email to the supplier about the shelf life issue.',
      view_discrepancies: 'List all discrepancies found and their severity.',
      generate_audit_report: 'What do I need to have ready for a CanadaGAP audit?',
      draft_escalation: 'Draft an internal email escalating the pricing discrepancy.',
      generate_compliance_report: 'Generate a compliance summary for this receiving batch.',
    };

    if (actionPrompts[action]) {
      setInput(actionPrompts[action]);
      setTimeout(() => handleSend(), 100);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`
          fixed bottom-6 right-6 z-[9999]
          w-14 h-14 rounded-full
          bg-gradient-to-br from-bmf-blue to-blue-600
          text-white shadow-lg
          flex items-center justify-center
          hover:scale-110 hover:shadow-xl
          transition-all duration-200
          ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}
        `}
        title="AI Assistant"
      >
        <Sparkles className="w-6 h-6" />
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[10000] w-[420px] h-[600px] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-bmf-blue to-blue-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">AI Assistant</h3>
                <p className="text-white/70 text-xs">
                  {context.useCase === 'quality' ? 'Quality & Compliance' :
                   context.useCase === 'customer-orders' ? 'Customer Orders' :
                   context.useCase === 'expenses' ? 'Expense Processing' :
                   'Document Processing'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Sparkles className="w-12 h-12 text-bmf-blue/30 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">How can I help you?</p>
                <p className="text-gray-400 text-sm">
                  Ask about documents, compliance, or draft emails
                </p>

                {/* Quick Start Buttons */}
                <div className="mt-6 space-y-2">
                  <button
                    onClick={() => handleQuickAction('summarize')}
                    className="w-full px-4 py-2 text-left text-sm bg-white rounded-lg border border-gray-200 hover:border-bmf-blue hover:bg-blue-50 transition-colors flex items-center gap-2"
                  >
                    <FileCheck className="w-4 h-4 text-bmf-blue" />
                    Summarize today's processing
                  </button>
                  {context.useCase === 'quality' && (
                    <button
                      onClick={() => handleQuickAction('check_compliance')}
                      className="w-full px-4 py-2 text-left text-sm bg-white rounded-lg border border-gray-200 hover:border-bmf-blue hover:bg-blue-50 transition-colors flex items-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Check CanadaGAP compliance
                    </button>
                  )}
                  <button
                    onClick={() => handleQuickAction('draft_supplier_email')}
                    className="w-full px-4 py-2 text-left text-sm bg-white rounded-lg border border-gray-200 hover:border-bmf-blue hover:bg-blue-50 transition-colors flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4 text-green-600" />
                    Draft a supplier email
                  </button>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`
                    max-w-[85%] rounded-2xl px-4 py-2
                    ${msg.role === 'user'
                      ? 'bg-bmf-blue text-white rounded-br-md'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm'
                    }
                  `}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-white/60' : 'text-gray-400'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-bmf-blue" />
                    <span className="text-sm text-gray-500">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Suggested Actions */}
            {lastResponse?.suggestedActions && lastResponse.suggestedActions.length > 0 && !isLoading && (
              <div className="flex flex-wrap gap-2 pt-2">
                {lastResponse.suggestedActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickAction(action.action)}
                    className="px-3 py-1.5 text-xs bg-white border border-bmf-blue/30 text-bmf-blue rounded-full hover:bg-bmf-blue hover:text-white transition-colors"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}

            {/* Draft Email Preview */}
            {lastResponse?.draftEmail && !isLoading && (
              <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4 text-bmf-blue" />
                  <span className="text-xs font-medium text-gray-600">Draft Email</span>
                </div>
                <div className="text-xs space-y-1">
                  <p><strong>To:</strong> {lastResponse.draftEmail.to}</p>
                  <p><strong>Subject:</strong> {lastResponse.draftEmail.subject}</p>
                  <div className="mt-2 p-2 bg-gray-50 rounded text-gray-700 whitespace-pre-wrap">
                    {lastResponse.draftEmail.body}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="px-3 py-1 text-xs bg-bmf-blue text-white rounded hover:bg-blue-700 transition-colors">
                    Copy to Clipboard
                  </button>
                  <button className="px-3 py-1 text-xs border border-gray-300 text-gray-600 rounded hover:bg-gray-50 transition-colors">
                    Edit
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask anything about your documents..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-bmf-blue focus:ring-1 focus:ring-bmf-blue"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 rounded-full bg-bmf-blue text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">
              Powered by Gemini AI
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export const FloatingAIAssistant = memo(FloatingAIAssistantComponent);
