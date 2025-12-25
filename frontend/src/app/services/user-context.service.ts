import { Injectable, signal, computed } from '@angular/core';

export interface UserContext {
    id?: string;
    email: string;
    name?: string;
    isAdmin?: boolean;
}

/**
 * Service to manage the current user context (authentication).
 * This context is sent with API requests via the X-User-Email header
 * to enable user profiling functionality.
 */
@Injectable({
    providedIn: 'root'
})
export class UserContextService {
    private readonly STORAGE_KEY = 'user-context';

    private readonly _currentUser = signal<UserContext | null>(this.loadFromStorage());

    readonly currentUser = this._currentUser.asReadonly();
    readonly isLoggedIn = computed(() => this._currentUser() !== null);
    readonly isAdmin = computed(() => this._currentUser()?.isAdmin === true);
    readonly userEmail = computed(() => this._currentUser()?.email ?? null);
    readonly userId = computed(() => this._currentUser()?.id ?? null);
    readonly userName = computed(() => this._currentUser()?.name ?? this._currentUser()?.email ?? 'Guest');

    /**
     * Login/Set the current user context.
     */
    login(email: string, name?: string, id?: string, isAdmin?: boolean): void {
        const user: UserContext = { email, name, id, isAdmin };
        this._currentUser.set(user);
        this.saveToStorage(user);
    }

    /**
     * Alias for login - for backward compatibility.
     */
    setUser(email: string, name?: string): void {
        this.login(email, name);
    }

    /**
     * Logout - Clear the current user context.
     */
    logout(): void {
        this._currentUser.set(null);
        this.removeFromStorage();
    }

    /**
     * Alias for logout - for backward compatibility.
     */
    clearUser(): void {
        this.logout();
    }

    /**
     * Get headers to include in API requests.
     */
    getHeaders(): Record<string, string> {
        const user = this._currentUser();
        if (!user) {
            return {};
        }

        const headers: Record<string, string> = {
            'X-User-Email': user.email
        };

        if (user.name) {
            headers['X-User-Name'] = user.name;
        }

        return headers;
    }

    private loadFromStorage(): UserContext | null {
        if (typeof localStorage === 'undefined') {
            return null;
        }
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    }

    private saveToStorage(user: UserContext): void {
        if (typeof localStorage === 'undefined') {
            return;
        }
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
        } catch {
            // Ignore storage errors
        }
    }

    private removeFromStorage(): void {
        if (typeof localStorage === 'undefined') {
            return;
        }
        try {
            localStorage.removeItem(this.STORAGE_KEY);
        } catch {
            // Ignore storage errors
        }
    }
}
