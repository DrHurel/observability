import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';
import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION, SEMRESATTRS_DEPLOYMENT_ENVIRONMENT } from '@opentelemetry/semantic-conventions';

export class TracingService {
    private static instance: TracingService;
    private readonly provider: WebTracerProvider;

    private constructor() {
        // Create a resource with service information
        const resource = Resource.default().merge(
            new Resource({
                [SEMRESATTRS_SERVICE_NAME]: 'observability-frontend',
                [SEMRESATTRS_SERVICE_VERSION]: '1.0.0',
                [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: 'production',
            })
        );

        // Initialize the tracer provider
        this.provider = new WebTracerProvider({
            resource: resource,
        });

        // Configure the OTLP exporter to send traces to OpenTelemetry Collector
        const otlpExporter = new OTLPTraceExporter({
            url: 'http://localhost:4318/v1/traces',
            headers: {},
        });

        // Use BatchSpanProcessor for better performance
        this.provider.addSpanProcessor(new BatchSpanProcessor(otlpExporter));

        // Register the provider
        this.provider.register({
            contextManager: new ZoneContextManager(),
        });

        // Register automatic instrumentations directly (not using registerInstrumentations to avoid Node.js dependencies)
        const documentLoadInstrumentation = new DocumentLoadInstrumentation();
        documentLoadInstrumentation.setTracerProvider(this.provider);

        const fetchInstrumentation = new FetchInstrumentation({
            propagateTraceHeaderCorsUrls: [
                /http:\/\/localhost:8080\/.*/,
                /http:\/\/localhost:4200\/.*/,
            ],
            clearTimingResources: true,
        });
        fetchInstrumentation.setTracerProvider(this.provider);

        const xhrInstrumentation = new XMLHttpRequestInstrumentation({
            propagateTraceHeaderCorsUrls: [
                /http:\/\/localhost:8080\/.*/,
                /http:\/\/localhost:4200\/.*/,
            ],
            clearTimingResources: true,
        });
        xhrInstrumentation.setTracerProvider(this.provider);

        const userInteractionInstrumentation = new UserInteractionInstrumentation({
            eventNames: ['click', 'submit'],
        });
        userInteractionInstrumentation.setTracerProvider(this.provider);

        console.log('OpenTelemetry tracing initialized for frontend');
    }

    public static getInstance(): TracingService {
        if (!TracingService.instance) {
            TracingService.instance = new TracingService();
        }
        return TracingService.instance;
    }

    public getTracer(name: string = 'default') {
        return this.provider.getTracer(name);
    }
}

// Initialize tracing on module load
export function initializeTracing(): void {
    TracingService.getInstance();
}
