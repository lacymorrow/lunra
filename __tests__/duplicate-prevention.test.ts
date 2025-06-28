import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { GoalDataManager } from '../lib/data-manager';
import { SavedGoal } from '../types';

// Mock localStorage
const mockLocalStorage = {
    store: {} as Record<string, string>,
    getItem: (key: string) => mockLocalStorage.store[key] || null,
    setItem: (key: string, value: string) => {
        mockLocalStorage.store[key] = value;
    },
    removeItem: (key: string) => {
        delete mockLocalStorage.store[key];
    },
    clear: () => {
        mockLocalStorage.store = {};
    }
};

// Mock window
Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage
});

// Mock goal service functions
jest.mock('../lib/services/goals', () => ({
    createGoal: jest.fn(),
    updateGoal: jest.fn(),
    deleteGoal: jest.fn(),
    getGoals: jest.fn(() => Promise.resolve([]))
}));

describe('Duplicate Prevention System', () => {
    let dataManager: GoalDataManager;

    const sampleGoal1: Omit<SavedGoal, 'id' | 'createdAt'> = {
        title: 'Learn JavaScript',
        description: 'Master JavaScript fundamentals',
        timeline: '3 months',
        progress: 0,
        status: 'in-progress',
        dueDate: '2024-06-01',
        subGoals: ['Variables', 'Functions', 'Objects'],
        completedSubGoals: 0,
        milestones: [
            { week: 1, task: 'Learn variables', status: 'pending', progress: 0 },
            { week: 2, task: 'Learn functions', status: 'pending', progress: 0 }
        ]
    };

    const sampleGoal2: Omit<SavedGoal, 'id' | 'createdAt'> = {
        title: 'Learn React',
        description: 'Build modern web applications',
        timeline: '2 months',
        progress: 0,
        status: 'in-progress',
        dueDate: '2024-05-01',
        subGoals: ['Components', 'State', 'Props'],
        completedSubGoals: 0,
        milestones: [
            { week: 1, task: 'Learn components', status: 'pending', progress: 0 }
        ]
    };

    beforeEach(() => {
        mockLocalStorage.clear();
        dataManager = new GoalDataManager();
    });

    afterEach(() => {
        dataManager.destroy();
    });

    describe('Goal Creation Duplicate Prevention', () => {
        it('should prevent creating identical goals', async () => {
            // Create first goal
            const goal1 = await dataManager.createGoal(sampleGoal1);
            expect(goal1.id).toBeDefined();
            expect(goal1.title).toBe(sampleGoal1.title);

            // Try to create identical goal
            const goal2 = await dataManager.createGoal(sampleGoal1);

            // Should return the same goal (not create new one)
            expect(goal2.id).toBe(goal1.id);
            expect(goal2.title).toBe(goal1.title);

            // Should only have one goal in storage
            const allGoals = await dataManager.getGoals();
            expect(allGoals).toHaveLength(1);
        });

        it('should allow creating different goals', async () => {
            // Create first goal
            const goal1 = await dataManager.createGoal(sampleGoal1);

            // Create different goal
            const goal2 = await dataManager.createGoal(sampleGoal2);

            // Should create different goals
            expect(goal1.id).not.toBe(goal2.id);
            expect(goal1.title).not.toBe(goal2.title);

            // Should have two goals in storage
            const allGoals = await dataManager.getGoals();
            expect(allGoals).toHaveLength(2);
        });

        it('should detect duplicates with different casing', async () => {
            // Create first goal
            const goal1 = await dataManager.createGoal(sampleGoal1);

            // Try to create goal with different casing
            const duplicateWithDifferentCase = {
                ...sampleGoal1,
                title: 'LEARN JAVASCRIPT', // Different casing
                description: 'MASTER JAVASCRIPT FUNDAMENTALS' // Different casing
            };

            const goal2 = await dataManager.createGoal(duplicateWithDifferentCase);

            // Should return the same goal
            expect(goal2.id).toBe(goal1.id);

            // Should only have one goal
            const allGoals = await dataManager.getGoals();
            expect(allGoals).toHaveLength(1);
        });

        it('should detect duplicates with extra whitespace', async () => {
            // Create first goal
            const goal1 = await dataManager.createGoal(sampleGoal1);

            // Try to create goal with extra whitespace
            const duplicateWithWhitespace = {
                ...sampleGoal1,
                title: '  Learn JavaScript  ', // Extra whitespace
                description: '  Master JavaScript fundamentals  ' // Extra whitespace
            };

            const goal2 = await dataManager.createGoal(duplicateWithWhitespace);

            // Should return the same goal
            expect(goal2.id).toBe(goal1.id);

            // Should only have one goal
            const allGoals = await dataManager.getGoals();
            expect(allGoals).toHaveLength(1);
        });

        it('should differentiate goals with different milestones', async () => {
            // Create first goal
            const goal1 = await dataManager.createGoal(sampleGoal1);

            // Create goal with same title but different milestones
            const goalWithDifferentMilestones = {
                ...sampleGoal1,
                milestones: [
                    { week: 1, task: 'Learn variables', status: 'pending', progress: 0 },
                    { week: 2, task: 'Learn functions', status: 'pending', progress: 0 },
                    { week: 3, task: 'Learn objects', status: 'pending', progress: 0 } // Additional milestone
                ]
            };

            const goal2 = await dataManager.createGoal(goalWithDifferentMilestones);

            // Should create different goals (different milestone count)
            expect(goal1.id).not.toBe(goal2.id);

            // Should have two goals
            const allGoals = await dataManager.getGoals();
            expect(allGoals).toHaveLength(2);
        });
    });

    describe('Goal Deletion and Signature Cleanup', () => {
        it('should clean up signatures when goals are deleted', async () => {
            // Create a goal
            const goal = await dataManager.createGoal(sampleGoal1);

            // Verify it exists
            let allGoals = await dataManager.getGoals();
            expect(allGoals).toHaveLength(1);

            // Delete the goal
            const deleted = await dataManager.deleteGoal(goal.id);
            expect(deleted).toBe(true);

            // Verify it's gone
            allGoals = await dataManager.getGoals();
            expect(allGoals).toHaveLength(0);

            // Try to create the same goal again - should succeed
            const newGoal = await dataManager.createGoal(sampleGoal1);
            expect(newGoal.id).toBeDefined();
            expect(newGoal.id).not.toBe(goal.id); // Should be new ID

            // Should have one goal again
            allGoals = await dataManager.getGoals();
            expect(allGoals).toHaveLength(1);
        });
    });

    describe('Signature Cleanup', () => {
        it('should clean up orphaned signatures', async () => {
            // Create goals
            const goal1 = await dataManager.createGoal(sampleGoal1);
            const goal2 = await dataManager.createGoal(sampleGoal2);

            // Verify they exist
            let allGoals = await dataManager.getGoals();
            expect(allGoals).toHaveLength(2);

            // Manually corrupt localStorage to simulate orphaned signatures
            const corruptedGoals = [goal1]; // Remove goal2 but keep its signature
            mockLocalStorage.setItem('savedGoals', JSON.stringify(corruptedGoals));

            // Call getGoals which should trigger cleanup
            allGoals = await dataManager.getGoals();
            expect(allGoals).toHaveLength(1);

            // Try to create goal2 again - should succeed if orphaned signature was cleaned
            const newGoal2 = await dataManager.createGoal(sampleGoal2);
            expect(newGoal2.id).toBeDefined();

            // Should have two goals
            allGoals = await dataManager.getGoals();
            expect(allGoals).toHaveLength(2);
        });
    });

    describe('Edge Cases', () => {
        it('should handle goals with empty descriptions', async () => {
            const goalWithEmptyDescription = {
                ...sampleGoal1,
                description: ''
            };

            const goalWithUndefinedDescription = {
                ...sampleGoal1,
                description: undefined as any
            };

            // Create first goal
            const goal1 = await dataManager.createGoal(goalWithEmptyDescription);

            // Try to create goal with undefined description
            const goal2 = await dataManager.createGoal(goalWithUndefinedDescription);

            // Should be treated as duplicates
            expect(goal2.id).toBe(goal1.id);

            // Should only have one goal
            const allGoals = await dataManager.getGoals();
            expect(allGoals).toHaveLength(1);
        });

        it('should handle goals with no milestones', async () => {
            const goalWithNoMilestones = {
                ...sampleGoal1,
                milestones: []
            };

            const goalWithUndefinedMilestones = {
                ...sampleGoal1,
                milestones: undefined as any
            };

            // Create first goal
            const goal1 = await dataManager.createGoal(goalWithNoMilestones);

            // Try to create goal with undefined milestones
            const goal2 = await dataManager.createGoal(goalWithUndefinedMilestones);

            // Should be treated as duplicates
            expect(goal2.id).toBe(goal1.id);

            // Should only have one goal
            const allGoals = await dataManager.getGoals();
            expect(allGoals).toHaveLength(1);
        });
    });
});

describe('Synchronization Duplicate Prevention', () => {
    let dataManager: GoalDataManager;

    beforeEach(() => {
        mockLocalStorage.clear();
        dataManager = new GoalDataManager('user123', {
            id: 'profile123',
            user_id: 'user123',
            full_name: 'Test User',
            avatar_url: null,
            plan_id: 'bloom',
            goals_limit: -1,
            stripe_customer_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
    });

    afterEach(() => {
        dataManager.destroy();
    });

    it('should report duplicates skipped during bidirectional sync', async () => {
        // Create local goal
        await dataManager.createGoal(sampleGoal1);

        // Mock database returning similar goal
        const mockGetGoals = require('../lib/services/goals').getGoals;
        mockGetGoals.mockResolvedValueOnce([
            {
                id: 'db-goal-123',
                user_id: 'user123',
                title: 'Learn JavaScript', // Same title
                description: 'Master JavaScript fundamentals', // Same description
                timeline: '3 months',
                progress: 0,
                status: 'in-progress',
                due_date: '2024-06-01',
                sub_goals: ['Variables', 'Functions', 'Objects'],
                completed_sub_goals: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                milestones: [
                    {
                        id: 'milestone-1',
                        goal_id: 'db-goal-123',
                        week: 1,
                        task: 'Learn variables',
                        status: 'pending',
                        progress: 0,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }
                ]
            }
        ]);

        // Perform sync
        const result = await dataManager.bidirectionalSync();

        // Should detect duplicates
        expect(result.duplicatesSkipped).toBeGreaterThan(0);
        expect(result.localToDbSynced).toBe(0); // Nothing synced up
        expect(result.dbToLocalSynced).toBe(0); // Nothing synced down
    });
});
