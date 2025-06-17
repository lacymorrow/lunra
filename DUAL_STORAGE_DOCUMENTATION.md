# Dual-Storage System Documentation

## Overview

The Lunra app implements a **dual-storage architecture** that provides offline-first functionality for all users while offering cloud synchronization as a premium feature for paid users.

## Architecture

### Storage Strategy

| User Type | Primary Storage | Secondary Storage | Sync Behavior | Offline Access |
|-----------|----------------|------------------|---------------|----------------|
| **Guest (No Account)** | localStorage | None | No sync | ✅ Full offline |
| **Free (Seedling Plan)** | localStorage | None | No sync | ✅ Full offline |
| **Paid (Bloom Plan)** | localStorage | Database | Bidirectional auto-sync | ✅ Full offline |

### Key Principles

1. **Offline-First**: All operations work immediately using localStorage
2. **Progressive Enhancement**: Cloud sync is layered on top for paid users
3. **Local Source of Truth**: In conflicts, local changes always win
4. **Background Sync**: Database operations never block the UI
5. **Graceful Degradation**: App works fully even if sync fails

## Implementation Details

### Data Manager Architecture

The `GoalDataManager` class (`lib/data-manager.ts`) handles all data operations:

\`\`\`typescript
export class GoalDataManager {
  private userId: string | null = null
  private userProfile: DatabaseUserProfile | null = null
  private syncIntervalId: NodeJS.Timeout | null = null

  // Key properties
  get isAuthenticated(): boolean
  get isPaidUser(): boolean  
  get shouldSync(): boolean
}
\`\`\`

### Storage Flow

#### For All Users (localStorage)

\`\`\`
User Action → localStorage Update → UI Update (Immediate)
\`\`\`

#### For Paid Users (localStorage + Cloud)

\`\`\`
User Action → localStorage Update → UI Update (Immediate)
           ↓
Background Cloud Sync (Non-blocking)
\`\`\`

### Sync Mechanisms

#### 1. Initial Sync (First Login)

- Transfers existing localStorage goals to database
- Preserves localStorage for offline access
- Used when user first signs up or logs in

#### 2. Bidirectional Sync (Paid Users Only)

- Runs automatically every 30 seconds
- Syncs local changes to database
- Syncs database changes to localStorage
- Resolves conflicts (local wins)

#### 3. Manual Sync

- Available for paid users
- Triggers immediate bidirectional sync
- Shows sync status and results

## API Reference

### GoalDataManager Methods

#### Core CRUD Operations

\`\`\`typescript
// Get all goals (always from localStorage)
async getGoals(): Promise<SavedGoal[]>

// Get goal by ID (supports both local IDs and UUIDs)
async getGoalById(id: number | string): Promise<SavedGoal | null>

// Create new goal (localStorage + background sync for paid users)
async createGoal(goalData: Omit<SavedGoal, "id" | "createdAt">): Promise<SavedGoal>

// Update existing goal (localStorage + background sync for paid users)
async updateGoal(id: number | string, goalData: Partial<SavedGoal>): Promise<SavedGoal | null>

// Delete goal (localStorage + background sync for paid users)
async deleteGoal(id: number | string): Promise<boolean>
\`\`\`

#### Sync Operations

\`\`\`typescript
// Initial sync for new users (legacy method)
async syncLocalGoalsToDatabase(): Promise<{
  synced: number;
  skipped: number;
  errors: string[];
  clearedLocal: boolean;
}>

// Bidirectional sync for paid users
async bidirectionalSync(): Promise<{
  localToDbSynced: number;
  dbToLocalSynced: number;
  conflicts: number;
  errors: string[];
}>

// Get sync status information
getSyncInfo(): {
  lastSync: string | null;
  isPaidUser: boolean;
  shouldSync: boolean;
  autoSyncActive: boolean;
}
\`\`\`

#### Milestone Operations

\`\`\`typescript
// Mark milestone as complete
async markMilestoneComplete(goalId: number, milestoneIndex: number): Promise<void>

// Undo milestone completion
async undoMilestoneComplete(goalId: number, milestoneIndex: number): Promise<void>

// Adjust goal timeline
async adjustTimeline(goalId: number): Promise<void>
\`\`\`

#### Lifecycle Management

\`\`\`typescript
// Update user data and sync settings
setUserData(userId: string | null, userProfile?: DatabaseUserProfile | null): void

// Clean up resources
destroy(): void
\`\`\`

### Context Integration

#### GoalDataProvider

\`\`\`typescript
interface GoalDataContextType {
  dataManager: GoalDataManager;
  goals: SavedGoal[];
  loading: boolean;
  error: Error | null;
  refreshGoals: () => Promise<void>;
  syncStatus: SyncStatus;
  triggerManualSync: () => Promise<void>;
}
\`\`\`

#### SyncStatus Interface

\`\`\`typescript
interface SyncStatus {
  isLoading: boolean;
  result?: {
    synced: number;
    skipped: number;
    errors: string[];
    clearedLocal: boolean;
  } | null;
  bidirectionalResult?: {
    localToDbSynced: number;
    dbToLocalSynced: number;
    conflicts: number;
    errors: string[];
  } | null;
}
\`\`\`

## Usage Examples

### Basic Goal Management

\`\`\`typescript
import { useGoalData } from "@/contexts/goal-data-context";

function MyComponent() {
  const { dataManager, goals, syncStatus } = useGoalData();

  // Create a new goal (works for all users)
  const createGoal = async () => {
    const goalData = {
      title: "Learn TypeScript",
      description: "Master TypeScript fundamentals",
      timeline: "3 months",
      progress: 0,
      status: "not-started",
      subGoals: [],
      completedSubGoals: 0,
      milestones: []
    };

    const newGoal = await dataManager.createGoal(goalData);
    console.log("Goal created:", newGoal);
  };

  // Update a goal
  const updateGoal = async (goalId: number) => {
    const updatedGoal = await dataManager.updateGoal(goalId, {
      progress: 50,
      status: "in-progress"
    });
    console.log("Goal updated:", updatedGoal);
  };

  return (
    <div>
      <h2>Goals ({goals.length})</h2>
      {/* Render goals */}
    </div>
  );
}
\`\`\`

### Manual Sync for Paid Users

\`\`\`typescript
import { useAuth } from "@/contexts/auth-context";
import { useGoalData } from "@/contexts/goal-data-context";

function SyncButton() {
  const { userProfile } = useAuth();
  const { triggerManualSync, syncStatus } = useGoalData();
  
  const isPaidUser = userProfile?.plan_id === 'bloom';

  if (!isPaidUser) return null;

  return (
    <button 
      onClick={triggerManualSync}
      disabled={syncStatus.isLoading}
    >
      {syncStatus.isLoading ? 'Syncing...' : 'Manual Sync'}
    </button>
  );
}
\`\`\`

### Sync Status Display

\`\`\`typescript
function SyncStatusIndicator() {
  const { user, userProfile } = useAuth();
  const { syncStatus } = useGoalData();
  
  const isPaidUser = user && userProfile?.plan_id === 'bloom';

  if (!isPaidUser) {
    return <span>Local Storage Only</span>;
  }

  if (syncStatus.isLoading) {
    return <span>Syncing...</span>;
  }

  if (syncStatus.bidirectionalResult) {
    const { localToDbSynced, dbToLocalSynced, errors } = syncStatus.bidirectionalResult;
    
    if (errors.length > 0) {
      return <span>Sync Error</span>;
    }
    
    if (localToDbSynced > 0 || dbToLocalSynced > 0) {
      return <span>Recently Synced</span>;
    }
  }

  return <span>Cloud + Local</span>;
}
\`\`\`

## UI Integration

### Status Indicators

The system provides different status indicators based on user type and sync state:

#### Free Users

- `Local Only` - Goals stored locally
- `Local Mode` - Offline functionality available
- Upgrade prompts for cloud sync

#### Paid Users

- `Cloud + Local` - Dual storage active
- `Syncing...` - Background sync in progress
- `↕️ Synced` - Recent bidirectional sync completed
- `Sync Issues` - Sync encountered problems

### Components Updated

1. **SiteHeader** - Shows sync status in header
2. **OfflineDemo** - Demonstrates dual storage
3. **DataMigrationBanner** - Different messaging for free vs paid
4. **GoalDataProvider** - Manages sync state

## Conflict Resolution

### Conflict Detection

Conflicts are detected by comparing key fields:

- `title`
- `description`
- `progress`
- `status`
- `milestones` (JSON comparison)

### Resolution Strategy

**Local Always Wins**: When conflicts are detected, the local version is considered the source of truth and overwrites the database version.

\`\`\`typescript
private hasConflict(localGoal: SavedGoal, dbGoal: SavedGoal): boolean {
  return (
    localGoal.title !== dbGoal.title ||
    localGoal.description !== dbGoal.description ||
    localGoal.progress !== dbGoal.progress ||
    localGoal.status !== dbGoal.status ||
    JSON.stringify(localGoal.milestones) !== JSON.stringify(dbGoal.milestones)
  )
}
\`\`\`

## Error Handling

### Graceful Degradation

The system is designed to gracefully handle various failure scenarios:

1. **Network Failures**: Local operations continue working
2. **Database Errors**: Background sync fails but local data is preserved
3. **Authentication Issues**: Sync stops but local functionality remains
4. **Partial Sync Failures**: Individual goal sync failures don't affect others

### Error Reporting

Sync errors are collected and reported through the `SyncStatus` interface:

\`\`\`typescript
{
  errors: string[]; // Array of error messages
  localToDbSynced: number; // Successful syncs despite errors
  dbToLocalSynced: number;
  conflicts: number;
}
\`\`\`

## Performance Considerations

### Auto-Sync Frequency

- **Interval**: 30 seconds for paid users
- **Condition**: Only runs when user is paid and authenticated
- **Efficiency**: Only syncs changed data, not full dataset

### Local Storage Management

- **Key**: `savedGoals` for goal data
- **Key**: `lastSyncTimestamp` for sync tracking
- **Cleanup**: Goals are never automatically deleted from localStorage
- **Size**: No explicit limits, relies on browser localStorage quotas

### Background Operations

All database operations run in background without blocking UI:

\`\`\`typescript
// Example: Create goal
const localGoal = createLocalGoal(goalData); // Immediate
// UI updates instantly with localGoal

if (this.shouldSync) {
  // Background sync (non-blocking)
  createGoal(localGoal, this.userId!).catch(console.error);
}
\`\`\`

## Migration from Previous System

### Backward Compatibility

The new system maintains compatibility with existing data:

1. **Existing localStorage goals**: Preserved and continue working
2. **Database goals**: Accessible through bidirectional sync for paid users
3. **Goal IDs**: Both numeric (localStorage) and UUID (database) supported

### Migration Path

1. **Free users**: No migration needed, localStorage continues working
2. **Paid users**: Automatic initial sync transfers localStorage goals to database
3. **Existing paid users**: Bidirectional sync merges database and localStorage

## Troubleshooting

### Common Issues

#### Sync Not Working

**Symptoms**: Manual sync button doesn't appear, auto-sync not running
**Solutions**:

1. Verify user has Bloom plan: `userProfile?.plan_id === 'bloom'`
2. Check authentication: `user?.id` exists
3. Verify auto-sync is running: `dataManager.getSyncInfo().autoSyncActive`

#### Goals Not Appearing

**Symptoms**: Goals don't show up after login
**Solutions**:

1. Check localStorage: Open DevTools → Application → Local Storage
2. Verify `savedGoals` key exists and has data
3. Check console for sync errors

#### Sync Errors

**Symptoms**: Sync status shows errors
**Solutions**:

1. Check network connectivity
2. Verify Supabase connection
3. Check console logs for detailed error messages
4. Try manual sync to get specific error details

### Debug Information

Use the sync info method to get current state:

\`\`\`typescript
const syncInfo = dataManager.getSyncInfo();
console.log('Sync Info:', {
  lastSync: syncInfo.lastSync,
  isPaidUser: syncInfo.isPaidUser,
  shouldSync: syncInfo.shouldSync,
  autoSyncActive: syncInfo.autoSyncActive
});
\`\`\`

### Console Logging

The system provides detailed console logging:

- `🔄` Starting sync operations
- `📤` Uploading local changes to database
- `📥` Downloading database changes to local
- `🔀` Resolving conflicts
- `✅` Successful operations
- `❌` Error conditions
- `⚠️` Warning conditions

## Testing

### Test Scenarios

1. **Guest User Experience**
   - Create goals without account
   - Verify localStorage storage
   - Confirm offline functionality

2. **Free User Experience**
   - Sign up for free account
   - Create goals as authenticated free user
   - Verify localStorage-only storage
   - Check that sync options are not available

3. **Paid User Experience**
   - Upgrade to Bloom plan
   - Verify auto-sync starts
   - Create goals and verify dual storage
   - Test manual sync functionality

4. **Cross-Device Sync**
   - Create goals on device A (paid user)
   - Login on device B
   - Verify goals sync to device B
   - Modify goals on device B
   - Verify changes sync back to device A

5. **Offline Scenarios**
   - Disconnect network
   - Create/modify goals
   - Reconnect network
   - Verify offline changes sync

6. **Conflict Resolution**
   - Modify same goal on multiple devices
   - Force sync
   - Verify local version wins

### Development Testing

\`\`\`bash
# Check localStorage in DevTools
localStorage.getItem('savedGoals')
localStorage.getItem('lastSyncTimestamp')

# Force sync in console
window.dataManager?.bidirectionalSync()

# Check sync status
window.dataManager?.getSyncInfo()
\`\`\`

## Security Considerations

### Data Protection

1. **Local Data**: Stored in browser's localStorage (client-side only)
2. **Database Data**: Protected by Supabase RLS policies
3. **Authentication**: Required for database access
4. **Authorization**: Plan-based access to sync features

### Privacy

- Free users' data never leaves their device
- Paid users' data is encrypted in transit to Supabase
- No data is shared between users
- Local storage can be cleared by user at any time

## Future Enhancements

### Potential Improvements

1. **Smart Sync**: Only sync changed fields, not entire goals
2. **Offline Queue**: Queue sync operations when offline
3. **Conflict UI**: Show conflict resolution interface to users
4. **Sync History**: Track detailed sync history
5. **Selective Sync**: Allow users to choose which goals to sync
6. **Real-time Sync**: Use WebSockets for instant cross-device updates
7. **Backup/Export**: Allow users to export their localStorage data

### Performance Optimizations

1. **Debounced Sync**: Batch rapid changes
2. **Delta Sync**: Only transfer changed data
3. **Compression**: Compress sync payloads
4. **Pagination**: Handle large datasets efficiently
5. **Caching**: Implement intelligent caching strategies

## Conclusion

The dual-storage system provides a robust, offline-first experience for all users while offering premium cloud synchronization features for paid subscribers. The architecture ensures data safety, optimal performance, and a seamless user experience across all plan types.

Key benefits:

- ✅ **Universal offline access**
- ✅ **No data loss scenarios**
- ✅ **Clear upgrade path**
- ✅ **Optimal performance**
- ✅ **Robust error handling**
- ✅ **Backward compatibility**
