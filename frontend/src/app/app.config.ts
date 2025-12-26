import { ApplicationConfig, provideBrowserGlobalErrorListeners, APP_INITIALIZER, PLATFORM_ID, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { userContextInterceptor } from './services/user-context.interceptor';

// Tracing initialization factory
function initializeTracingFactory() {
  const platformId = inject(PLATFORM_ID);
  
  return async () => {
    if (isPlatformBrowser(platformId)) {
      // Dynamically import to avoid SSR issues
      const { initializeTracing } = await import('./services/tracing.service');
      initializeTracing();
      console.log('OpenTelemetry tracing initialized via APP_INITIALIZER');
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([userContextInterceptor])),
    provideClientHydration(withEventReplay()),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeTracingFactory,
      multi: true,
    }
  ]
};
