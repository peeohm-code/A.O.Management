import { describe, it, expect } from 'vitest';
import type { ChecklistItemResult, ChecklistStatus } from '../../shared/detailedTypes';

/**
 * Checklist Operations Tests
 * ทดสอบ logic การจัดการ checklist และการคำนวณสถานะ
 */

// Mock checklist item results
const mockChecklistItems: ChecklistItemResult[] = [
  {
    id: 1,
    taskChecklistId: 1,
    templateItemId: 1,
    result: 'pass',
    note: null,
    description: 'Item 1',
    category: 'Safety',
  },
  {
    id: 2,
    taskChecklistId: 1,
    templateItemId: 2,
    result: 'pass',
    note: null,
    description: 'Item 2',
    category: 'Quality',
  },
  {
    id: 3,
    taskChecklistId: 1,
    templateItemId: 3,
    result: 'fail',
    note: 'Needs correction',
    description: 'Item 3',
    category: 'Safety',
  },
  {
    id: 4,
    taskChecklistId: 1,
    templateItemId: 4,
    result: 'na',
    note: 'Not applicable',
    description: 'Item 4',
    category: 'Optional',
  },
];

/**
 * Calculate checklist status based on item results
 */
export function calculateChecklistStatus(items: ChecklistItemResult[]): ChecklistStatus {
  if (items.length === 0) return 'not_started';
  
  const hasFailedItems = items.some(item => item.result === 'fail');
  const allItemsChecked = items.every(item => item.result !== null);
  
  if (hasFailedItems) return 'failed';
  if (allItemsChecked) return 'completed';
  
  return 'in_progress';
}

/**
 * Calculate checklist pass rate
 */
export function calculatePassRate(items: ChecklistItemResult[]): number {
  if (items.length === 0) return 0;
  
  // Exclude N/A items from calculation
  const applicableItems = items.filter(item => item.result !== 'na');
  if (applicableItems.length === 0) return 100;
  
  const passedItems = applicableItems.filter(item => item.result === 'pass').length;
  return Math.round((passedItems / applicableItems.length) * 100);
}

/**
 * Get failed items from checklist
 */
export function getFailedItems(items: ChecklistItemResult[]): ChecklistItemResult[] {
  return items.filter(item => item.result === 'fail');
}

/**
 * Get checklist statistics
 */
export function getChecklistStats(items: ChecklistItemResult[]) {
  return {
    total: items.length,
    passed: items.filter(item => item.result === 'pass').length,
    failed: items.filter(item => item.result === 'fail').length,
    na: items.filter(item => item.result === 'na').length,
    passRate: calculatePassRate(items),
  };
}

/**
 * Validate checklist completion
 */
export function validateChecklistCompletion(items: ChecklistItemResult[]): {
  isComplete: boolean;
  missingItems: number;
  errors: string[];
} {
  const errors: string[] = [];
  const uncheckedItems = items.filter(item => !item.result);
  
  if (items.length === 0) {
    errors.push('Checklist has no items');
  }
  
  if (uncheckedItems.length > 0) {
    errors.push(`${uncheckedItems.length} items not checked`);
  }
  
  return {
    isComplete: errors.length === 0,
    missingItems: uncheckedItems.length,
    errors,
  };
}

/**
 * Group checklist items by category
 */
export function groupItemsByCategory(items: ChecklistItemResult[]): Record<string, ChecklistItemResult[]> {
  return items.reduce((acc, item) => {
    const category = item.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItemResult[]>);
}

/**
 * Calculate category pass rates
 */
export function calculateCategoryPassRates(items: ChecklistItemResult[]): Record<string, number> {
  const grouped = groupItemsByCategory(items);
  const passRates: Record<string, number> = {};
  
  for (const [category, categoryItems] of Object.entries(grouped)) {
    passRates[category] = calculatePassRate(categoryItems);
  }
  
  return passRates;
}

// ============= Tests =============

describe('Checklist Operations', () => {
  describe('calculateChecklistStatus', () => {
    it('should return "not_started" for empty checklist', () => {
      const status = calculateChecklistStatus([]);
      expect(status).toBe('not_started');
    });

    it('should return "failed" when any item fails', () => {
      const status = calculateChecklistStatus(mockChecklistItems);
      expect(status).toBe('failed');
    });

    it('should return "completed" when all items pass or N/A', () => {
      const allPassItems = mockChecklistItems.filter(item => item.result !== 'fail');
      const status = calculateChecklistStatus(allPassItems);
      expect(status).toBe('completed');
    });
  });

  describe('calculatePassRate', () => {
    it('should calculate pass rate correctly', () => {
      const passRate = calculatePassRate(mockChecklistItems);
      // 2 pass out of 3 applicable items (excluding N/A) = 66.67% ≈ 67%
      expect(passRate).toBe(67);
    });

    it('should return 0 for empty checklist', () => {
      const passRate = calculatePassRate([]);
      expect(passRate).toBe(0);
    });

    it('should return 100 when all applicable items pass', () => {
      const allPassItems = mockChecklistItems.filter(item => item.result !== 'fail');
      const passRate = calculatePassRate(allPassItems);
      expect(passRate).toBe(100);
    });

    it('should exclude N/A items from calculation', () => {
      const itemsWithNA: ChecklistItemResult[] = [
        { ...mockChecklistItems[0], result: 'pass' },
        { ...mockChecklistItems[1], result: 'na' },
        { ...mockChecklistItems[2], result: 'na' },
      ];
      const passRate = calculatePassRate(itemsWithNA);
      expect(passRate).toBe(100); // Only 1 applicable item, and it passed
    });
  });

  describe('getFailedItems', () => {
    it('should return only failed items', () => {
      const failedItems = getFailedItems(mockChecklistItems);
      expect(failedItems).toHaveLength(1);
      expect(failedItems[0].result).toBe('fail');
    });

    it('should return empty array when no items fail', () => {
      const passItems = mockChecklistItems.filter(item => item.result !== 'fail');
      const failedItems = getFailedItems(passItems);
      expect(failedItems).toHaveLength(0);
    });
  });

  describe('getChecklistStats', () => {
    it('should calculate statistics correctly', () => {
      const stats = getChecklistStats(mockChecklistItems);
      
      expect(stats.total).toBe(4);
      expect(stats.passed).toBe(2);
      expect(stats.failed).toBe(1);
      expect(stats.na).toBe(1);
      expect(stats.passRate).toBe(67);
    });

    it('should handle empty checklist', () => {
      const stats = getChecklistStats([]);
      
      expect(stats.total).toBe(0);
      expect(stats.passed).toBe(0);
      expect(stats.failed).toBe(0);
      expect(stats.na).toBe(0);
      expect(stats.passRate).toBe(0);
    });
  });

  describe('validateChecklistCompletion', () => {
    it('should validate completed checklist', () => {
      const validation = validateChecklistCompletion(mockChecklistItems);
      
      expect(validation.isComplete).toBe(true);
      expect(validation.missingItems).toBe(0);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect empty checklist', () => {
      const validation = validateChecklistCompletion([]);
      
      expect(validation.isComplete).toBe(false);
      expect(validation.errors).toContain('Checklist has no items');
    });

    it('should detect unchecked items', () => {
      const incompleteItems: ChecklistItemResult[] = [
        { ...mockChecklistItems[0], result: 'pass' },
        { ...mockChecklistItems[1], result: null as any },
      ];
      
      const validation = validateChecklistCompletion(incompleteItems);
      
      expect(validation.isComplete).toBe(false);
      expect(validation.missingItems).toBe(1);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('groupItemsByCategory', () => {
    it('should group items by category correctly', () => {
      const grouped = groupItemsByCategory(mockChecklistItems);
      
      expect(grouped['Safety']).toHaveLength(2);
      expect(grouped['Quality']).toHaveLength(1);
      expect(grouped['Optional']).toHaveLength(1);
    });

    it('should handle items without category', () => {
      const itemsWithoutCategory: ChecklistItemResult[] = [
        { ...mockChecklistItems[0], category: null },
      ];
      
      const grouped = groupItemsByCategory(itemsWithoutCategory);
      expect(grouped['Uncategorized']).toHaveLength(1);
    });
  });

  describe('calculateCategoryPassRates', () => {
    it('should calculate pass rates for each category', () => {
      const passRates = calculateCategoryPassRates(mockChecklistItems);
      
      expect(passRates['Safety']).toBe(50); // 1 pass, 1 fail
      expect(passRates['Quality']).toBe(100); // 1 pass
      expect(passRates['Optional']).toBe(100); // 1 N/A (excluded from calculation)
    });

    it('should handle empty items', () => {
      const passRates = calculateCategoryPassRates([]);
      expect(Object.keys(passRates)).toHaveLength(0);
    });
  });
});
