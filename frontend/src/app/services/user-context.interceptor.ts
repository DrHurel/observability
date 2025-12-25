import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { UserContextService } from './user-context.service';

/**
 * HTTP interceptor that adds user context headers to API requests.
 * This enables user profiling on the backend.
 */
export const userContextInterceptor: HttpInterceptorFn = (req, next) => {
    const userContext = inject(UserContextService);
    const headers = userContext.getHeaders();

    if (Object.keys(headers).length > 0) {
        const modifiedReq = req.clone({
            setHeaders: headers
        });
        return next(modifiedReq);
    }

    return next(req);
};
