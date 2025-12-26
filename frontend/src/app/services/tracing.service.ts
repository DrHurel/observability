import { WebTracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';
import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { registerInstrumentations } from '@opentelemetry/instrumentation';

// deployment.environment is an experimental attribute, using string literal
const ATTR_DEPLOYMENT_ENVIRONMENT = 'deployment.environment';

// Check if we're running in a browser environment
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

export class TracingService {
    private static instance: TracingService | null = null;
    private readonly provider: WebTracerProvider | null = null;

    private constructor() {
        if (!isBrowser) {
            console.log('OpenTelemetry tracing skipped (server-side rendering)');
            return;
        }

        // Create a resource with service information
        const resource = Resource.default().merge(
            new Resource({
                [ATTR_SERVICE_NAME]: 'observability-frontend',
                [ATTR_SERVICE_VERSION]: '1.0.0',
                [ATTR_DEPLOYMENT_ENVIRONMENT]: 'production',
            })
        );

        // Configure the OTLP exporter to send traces to OpenTelemetry Collector via nginx
        const tracesUrl = `${window.location.origin}/v1/traces`;
        const otlpExporter = new OTLPTraceExporter({
            url: tracesUrl,
            headers: {},
        });

        // Initialize the tracer provider with span processor
        this.provider = new WebTracerProvider({
            resource: resource,
            spanProcessors: [new BatchSpanProcessor(otlpExporter)],
        });

        // Register the provider with context manager
        this.provider.register({
            contextManager: new ZoneContextManager(),
        });

        // Register automatic instrumentations using the modern API
        registerInstrumentations({
            tracerProvider: this.provider,
            instrumentations: [
                new DocumentLoadInstrumentation(),
                new FetchInstrumentation({
                    propagateTraceHeaderCorsUrls: [
                        new RegExp(`${window.location.origin}/.*`),
                    ],
                    clearTimingResources: true,
                }),
                new XMLHttpRequestInstrumentation({
                    propagateTraceHeaderCorsUrls: [
                        new RegExp(`${window.location.origin}/.*`),
                    ],
                    clearTimingResources: true,
                }),
                new UserInteractionInstrumentation({
                    eventNames: ['click', 'submit'],
                }),
            ],
        });

        console.log('OpenTelemetry tracing initialized for frontend at:', tracesUrl);
    }

    public static getInstance(): TracingService {
        if (!TracingService.instance) {
            TracingService.instance = new TracingService();
        }
        return TracingService.instance;
    }

    public getTracer(name: string = 'default') {
        if (!this.provider) {
            // Return a no-op tracer for SSR
            return {
                startSpan: () => ({
                    setAttribute: () => { },
                    end: () => { },
                }),
            } as any;
        }
        return this.provider.getTracer(name);
    }
}

// Initialize tracing on module load (only runs in browser)
export function initializeTracing(): void {
    if (isBrowser) {
        TracingService.getInstance();
    }
}
