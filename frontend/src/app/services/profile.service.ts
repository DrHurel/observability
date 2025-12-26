import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserProfile } from '../models/profile.model';
import { environment } from '../../environments/environment';
import { UserContextService } from './user-context.service';

@Injectable({
    providedIn: 'root'
})
export class ProfileService {
    private readonly http = inject(HttpClient);
    private readonly userContext = inject(UserContextService);
    private readonly apiUrl = `${environment.apiUrl}/api/profiles`;

    /**
     * Get all user profiles.
     */
    getAllProfiles(): Observable<UserProfile[]> {
        return this.http.get<UserProfile[]>(this.apiUrl);
    }

    /**
     * Get a profile by user ID.
     */
    getProfileByUserId(userId: string): Observable<UserProfile> {
        return this.http.get<UserProfile>(`${this.apiUrl}/user/${userId}`);
    }

    /**
     * Get a profile by user email.
     */
    getProfileByEmail(email: string): Observable<UserProfile> {
        return this.http.get<UserProfile>(`${this.apiUrl}/email/${email}`);
    }

    /**
     * Get the current user's profile.
     */
    getCurrentUserProfile(): Observable<UserProfile> {
        const email = this.userContext.userEmail();
        if (!email) {
            throw new Error('No user context set');
        }
        return this.getProfileByEmail(email);
    }

    /**
     * Get profiles by profile type.
     */
    getProfilesByType(profileType: string): Observable<UserProfile[]> {
        return this.http.get<UserProfile[]>(`${this.apiUrl}/type/${profileType}`);
    }

    /**
     * Get profile statistics.
     */
    getProfileStats(): Observable<Record<string, number>> {
        return this.http.get<Record<string, number>>(`${this.apiUrl}/stats`);
    }
}
