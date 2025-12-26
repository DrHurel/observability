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

export class TracingService {
    private static instance: TracingService;
    private readonly provider: WebTracerProvider;

    private constructor() {
        // Create a resource with service information
        const resource = Resource.default().merge(
            new Resource({
                [ATTR_SERVICE_NAME]: 'observability-frontend',
                [ATTR_SERVICE_VERSION]: '1.0.0',
                [ATTR_DEPLOYMENT_ENVIRONMENT]: 'production',
            })
        );

        // Configure the OTLP exporter to send traces to OpenTelemetry Collector
        const otlpExporter = new OTLPTraceExporter({
            url: 'http://localhost:4318/v1/traces',
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
                        /http:\/\/localhost:8080\/.*/,
                        /http:\/\/localhost:4200\/.*/,
                    ],
                    clearTimingResources: true,
                }),
                new XMLHttpRequestInstrumentation({
                    propagateTraceHeaderCorsUrls: [
                        /http:\/\/localhost:8080\/.*/,
                        /http:\/\/localhost:4200\/.*/,
                    ],
                    clearTimingResources: true,
                }),
                new UserInteractionInstrumentation({
                    eventNames: ['click', 'submit'],
                }),
            ],
        });

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
