import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { initializeTracing } from './app/services/tracing-simple.service';

// Initialize OpenTelemetry tracing before bootstrapping the application
initializeTracing();

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));

