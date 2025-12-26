import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Tracing is initialized via APP_INITIALIZER in app.config.ts
// This ensures it only runs in the browser after hydration

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));

