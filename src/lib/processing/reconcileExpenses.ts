// Expense reconciliation engine
// Validates expense submissions against policy limits

import type { Discrepancy, ReconciliationResult } from './types';

interface ExpenseEntry {
  expense_id: string;
  employee_id: string;
  employee_name: string;
  department?: string;
  approver?: string;
  submission_date: string;
  category: string;
  merchant?: string;
  description?: string;
  amount: number;
  receipt_attached: boolean;
  status: string;
}

interface PolicyLimit {
  category: string;
  limit_amount: number;
  description?: string;
}

interface ExpenseIssue {
  expense_id: string;
  issue_type: string;
  severity: string;
  details: string;
  recommended_action?: string;
}

const RECEIPT_THRESHOLD = 25; // Receipts required for expenses over $25

export function reconcileExpenses(
  expenses: ExpenseEntry[],
  policyLimits: PolicyLimit[],
  preExistingIssues: ExpenseIssue[]
): ReconciliationResult {
  const discrepancies: Discrepancy[] = [];
  const cleanExpenseIds: string[] = [];

  // Build lookup map for policy limits
  const limitByCategory = new Map<string, number>();
  for (const limit of policyLimits) {
    limitByCategory.set(limit.category, limit.limit_amount);
  }

  // Track expenses by key for duplicate detection
  const expenseFingerprints = new Map<string, ExpenseEntry>();

  // Process each expense
  for (const expense of expenses) {
    let hasIssue = false;

    // Check 1: Over policy limit
    const categoryLimit = limitByCategory.get(expense.category);
    if (categoryLimit && expense.amount > categoryLimit) {
      const overage = expense.amount - categoryLimit;
      discrepancies.push({
        id: `disc-${expense.expense_id}-over-limit`,
        type: 'quantity_mismatch' as const,
        severity: overage > categoryLimit * 0.5 ? 'high' : 'medium',
        shipment_id: expense.expense_id,
        field: 'amount',
        expected: `≤$${categoryLimit.toFixed(2)}`,
        actual: `$${expense.amount.toFixed(2)}`,
        difference: overage,
        confidence: 100,
        recommendedAction: 'Request justification from employee. May require manager override approval.',
        details: `${expense.employee_name}'s ${expense.category} expense of $${expense.amount.toFixed(2)} at ${expense.merchant || 'vendor'} exceeds policy limit of $${categoryLimit.toFixed(2)}. Overage: $${overage.toFixed(2)}.`,
      });
      hasIssue = true;
    }

    // Check 2: Missing receipt
    if (!expense.receipt_attached && expense.amount > RECEIPT_THRESHOLD) {
      discrepancies.push({
        id: `disc-${expense.expense_id}-missing-receipt`,
        type: 'missing_receipt' as const,
        severity: 'medium',
        shipment_id: expense.expense_id,
        field: 'receipt',
        expected: 'Receipt attached',
        actual: 'No receipt',
        confidence: 100,
        recommendedAction: 'Request receipt from employee. If unavailable, require signed expense declaration form.',
        details: `${expense.employee_name}'s ${expense.category} expense of $${expense.amount.toFixed(2)} at ${expense.merchant || 'vendor'} is missing receipt documentation. Policy requires receipts for expenses over $${RECEIPT_THRESHOLD}.`,
      });
      hasIssue = true;
    }

    // Check 3: Duplicate detection
    const fingerprint = `${expense.employee_id}-${expense.merchant}-${expense.amount}-${expense.category}`;
    const existing = expenseFingerprints.get(fingerprint);
    if (existing) {
      // Check if dates are within 7 days (potential duplicate)
      const existingDate = new Date(existing.submission_date);
      const currentDate = new Date(expense.submission_date);
      const daysDiff = Math.abs((currentDate.getTime() - existingDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff <= 7) {
        discrepancies.push({
          id: `disc-${expense.expense_id}-duplicate`,
          type: 'extra_scan' as const, // Using available type for duplicate
          severity: 'high',
          shipment_id: expense.expense_id,
          field: 'duplicate',
          expected: 'Unique expense',
          actual: `Matches ${existing.expense_id}`,
          confidence: 85,
          recommendedAction: 'Verify with employee if this is a separate transaction. Reject if confirmed duplicate.',
          details: `Potential duplicate: ${expense.employee_name}'s expense at ${expense.merchant || 'vendor'} for $${expense.amount.toFixed(2)} appears to match ${existing.expense_id} submitted on ${existing.submission_date}.`,
        });
        hasIssue = true;
      }
    } else {
      expenseFingerprints.set(fingerprint, expense);
    }

    if (!hasIssue) {
      cleanExpenseIds.push(expense.expense_id);
    }
  }

  // Include pre-existing issues from database
  for (const issue of preExistingIssues) {
    const existingDisc = discrepancies.find(d =>
      d.shipment_id === issue.expense_id &&
      d.details.includes(issue.details.substring(0, 30))
    );

    if (!existingDisc) {
      discrepancies.push({
        id: `db-issue-${issue.expense_id}-${issue.issue_type}`,
        type: mapIssueType(issue.issue_type),
        severity: issue.severity as 'low' | 'medium' | 'high' | 'critical',
        shipment_id: issue.expense_id,
        field: issue.issue_type,
        expected: 'Compliant',
        actual: 'Policy violation',
        confidence: 95,
        recommendedAction: issue.recommended_action || 'Review and resolve issue.',
        details: issue.details,
      });
    }
  }

  const avgConfidence = discrepancies.length > 0
    ? discrepancies.reduce((sum, d) => sum + d.confidence, 0) / discrepancies.length
    : 100;

  return {
    clean: cleanExpenseIds,
    discrepancies,
    totalProcessed: expenses.length,
    totalFlagged: discrepancies.length,
    avgConfidence: Math.round(avgConfidence),
  };
}

function mapIssueType(issueType: string): Discrepancy['type'] {
  switch (issueType) {
    case 'over_limit':
      return 'quantity_mismatch';
    case 'missing_receipt':
      return 'missing_receipt';
    case 'duplicate':
      return 'extra_scan';
    default:
      return 'quantity_mismatch';
  }
}
