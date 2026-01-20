// Expense Report data generator for Big Marble Farms
// Generates realistic expense submissions with planted errors for demo

// Expense categories and limits
const EXPENSE_CATEGORIES = {
  meals: { limit: 75, description: 'Business meals and entertainment' },
  travel: { limit: 500, description: 'Transportation and lodging' },
  supplies: { limit: 200, description: 'Office and operational supplies' },
  equipment: { limit: 1000, description: 'Tools and equipment (requires pre-approval)' },
  fuel: { limit: 150, description: 'Vehicle fuel and maintenance' },
  training: { limit: 300, description: 'Professional development' },
  other: { limit: 100, description: 'Miscellaneous expenses' },
};

// Employees who submit expenses
const SUBMITTERS = [
  { id: 'BM-1003', name: 'M. Santos', department: 'Packhouse', approver: 'L. Morgan' },
  { id: 'BM-1007', name: 'L. Martinez', department: 'Logistics', approver: 'R. Gomez' },
  { id: 'BM-1009', name: 'N. Brooks', department: 'Operations', approver: 'R. Gomez' },
  { id: 'BM-1012', name: 'P. Singh', department: 'Maintenance', approver: 'J. Rivera' },
  { id: 'BM-1013', name: 'G. Hall', department: 'Finance', approver: 'A. Mercer' },
];

// Common vendors/merchants
const MERCHANTS = {
  meals: ['Tim Hortons', 'Subway', 'Boston Pizza', "McDonald's", 'Earls Kitchen'],
  travel: ['WestJet', 'Air Canada', 'Holiday Inn', 'Enterprise Rent-A-Car', 'Uber'],
  supplies: ['Staples', 'Amazon', 'Home Depot', 'Canadian Tire', 'Uline'],
  equipment: ['Home Depot', 'Princess Auto', 'Fastenal', 'Grainger', 'Amazon'],
  fuel: ['Shell', 'Petro-Canada', 'Esso', 'Co-op Gas', 'Husky'],
  training: ['Udemy', 'CanadaGAP Training', 'Safety First Inc', 'LinkedIn Learning'],
  other: ['Various', 'Miscellaneous'],
};

export interface ExpenseEntry {
  expense_id: string;
  employee_id: string;
  employee_name: string;
  department: string;
  approver: string;
  submission_date: string;
  category: string;
  merchant: string;
  description: string;
  amount: number;
  receipt_attached: boolean;
  status: 'pending' | 'approved' | 'flagged' | 'rejected';
}

export interface ExpensePlantedError {
  expense_id: string;
  type: 'over_limit' | 'missing_receipt' | 'unapproved_category' | 'duplicate';
  severity: 'medium' | 'high';
  description: string;
  recommendedAction: string;
}

export interface GeneratedExpenseScenario {
  expenses: ExpenseEntry[];
  plantedErrors: ExpensePlantedError[];
  policyLimits: Array<{category: string; limit: number; description: string}>;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function generateExpenseScenario(): GeneratedExpenseScenario {
  const expenses: ExpenseEntry[] = [];
  const plantedErrors: ExpensePlantedError[] = [];

  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 7); // Start from a week ago

  let expenseCounter = 1;

  // Select which expenses get planted errors
  const overLimitIndex = 1; // Second expense
  const missingReceiptIndex = 3; // Fourth expense
  const duplicateIndex = 5; // Sixth expense (duplicate of another)

  // Generate 6-8 expense entries
  const numExpenses = 6 + Math.floor(Math.random() * 3);

  for (let i = 0; i < numExpenses; i++) {
    const submitter = SUBMITTERS[Math.floor(Math.random() * SUBMITTERS.length)];
    const categoryKey = Object.keys(EXPENSE_CATEGORIES)[Math.floor(Math.random() * Object.keys(EXPENSE_CATEGORIES).length)] as keyof typeof EXPENSE_CATEGORIES;
    const category = EXPENSE_CATEGORIES[categoryKey];
    const merchantList = MERCHANTS[categoryKey] || MERCHANTS.other;
    const merchant = merchantList[Math.floor(Math.random() * merchantList.length)];

    const expenseDate = addDays(baseDate, i);
    const expenseId = `EXP-2025-${String(expenseCounter).padStart(4, '0')}`;
    expenseCounter++;

    // Normal amount (within limits)
    let amount = Math.round((category.limit * (0.3 + Math.random() * 0.5)) * 100) / 100;
    let receiptAttached = true;
    let status: ExpenseEntry['status'] = 'pending';

    // Planted error: Over limit
    if (i === overLimitIndex) {
      amount = Math.round((category.limit * (1.3 + Math.random() * 0.5)) * 100) / 100; // 130-180% of limit
      status = 'flagged';

      plantedErrors.push({
        expense_id: expenseId,
        type: 'over_limit',
        severity: 'high',
        description: `${submitter.name}'s ${categoryKey} expense of $${amount.toFixed(2)} exceeds policy limit of $${category.limit}. Overage: $${(amount - category.limit).toFixed(2)}.`,
        recommendedAction: 'Request justification from employee. May require manager override approval.',
      });
    }

    // Planted error: Missing receipt
    if (i === missingReceiptIndex && amount > 25) {
      receiptAttached = false;
      status = 'flagged';

      plantedErrors.push({
        expense_id: expenseId,
        type: 'missing_receipt',
        severity: 'medium',
        description: `${submitter.name}'s ${categoryKey} expense of $${amount.toFixed(2)} at ${merchant} is missing receipt documentation. Policy requires receipts for expenses over $25.`,
        recommendedAction: 'Request receipt from employee. If unavailable, require signed expense declaration form.',
      });
    }

    // Generate expense descriptions
    const descriptions: Record<string, string[]> = {
      meals: ['Team lunch meeting', 'Client dinner', 'Working lunch', 'Vendor meeting'],
      travel: ['Conference travel', 'Customer site visit', 'Training travel', 'Supplier meeting'],
      supplies: ['Office supplies', 'Packaging materials', 'Cleaning supplies', 'Safety equipment'],
      equipment: ['Tool replacement', 'Equipment repair parts', 'New equipment purchase'],
      fuel: ['Delivery vehicle fuel', 'Fleet vehicle gas', 'Mileage reimbursement'],
      training: ['Safety certification', 'Online course', 'Industry conference'],
      other: ['Miscellaneous expense', 'Emergency purchase'],
    };

    const descList = descriptions[categoryKey] || descriptions.other;
    const description = descList[Math.floor(Math.random() * descList.length)];

    expenses.push({
      expense_id: expenseId,
      employee_id: submitter.id,
      employee_name: submitter.name,
      department: submitter.department,
      approver: submitter.approver,
      submission_date: expenseDate.toISOString().split('T')[0],
      category: categoryKey,
      merchant,
      description,
      amount,
      receipt_attached: receiptAttached,
      status,
    });
  }

  // Add duplicate expense (planted error)
  if (expenses.length > duplicateIndex) {
    const originalExpense = expenses[1]; // Duplicate of second expense
    const duplicateId = `EXP-2025-${String(expenseCounter).padStart(4, '0')}`;

    expenses.push({
      ...originalExpense,
      expense_id: duplicateId,
      submission_date: addDays(new Date(originalExpense.submission_date), 2).toISOString().split('T')[0],
      status: 'flagged',
    });

    plantedErrors.push({
      expense_id: duplicateId,
      type: 'duplicate',
      severity: 'high',
      description: `Potential duplicate: ${originalExpense.employee_name}'s expense at ${originalExpense.merchant} for $${originalExpense.amount.toFixed(2)} appears to match ${originalExpense.expense_id} submitted on ${originalExpense.submission_date}.`,
      recommendedAction: 'Verify with employee if this is a separate transaction. Reject if confirmed duplicate.',
    });
  }

  // Build policy limits for display
  const policyLimits = Object.entries(EXPENSE_CATEGORIES).map(([key, value]) => ({
    category: key,
    limit: value.limit,
    description: value.description,
  }));

  return {
    expenses,
    plantedErrors,
    policyLimits,
  };
}

export { generateExpenseScenario as generateDeterministicExpenseScenario };
