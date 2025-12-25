export interface ProfileAction {
    actionType: string;
    operationType: string;
    targetEntity: string;
    targetId: string | null;
    productPrice: number | null;
    timestamp: string;
    details: string | null;
}

export interface UserProfile {
    id: string;
    userId: string | null;
    userName: string | null;
    userEmail: string | null;
    readOperations: number;
    writeOperations: number;
    expensiveProductSearches: number;
    expensiveThreshold: number;
    profileType: 'READ_HEAVY' | 'WRITE_HEAVY' | 'EXPENSIVE_SEEKER' | 'BALANCED';
    recentActions: ProfileAction[];
    averageProductPriceViewed: number;
    maxProductPriceViewed: number;
    createdAt: string;
    updatedAt: string;
    lastActivityAt: string;
    summary: string;
}
