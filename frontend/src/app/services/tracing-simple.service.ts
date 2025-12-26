import { WebTracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

export class TracingService {
    private static instance: TracingService;
    private readonly provider: WebTracerProvider;

    private constructor() {
        // Create a resource with service information
        const resource = Resource.default().merge(
            new Resource({
                [ATTR_SERVICE_NAME]: 'observability-frontend',
            })
        );

        // Configure the OTLP exporter to send traces to OpenTelemetry Collector
        const otlpExporter = new OTLPTraceExporter({
            url: 'http://localhost:4318/v1/traces',
            headers: {},
        });

        // Initialize the tracer provider with BatchSpanProcessor for better performance
        this.provider = new WebTracerProvider({
            resource: resource,
            spanProcessors: [new BatchSpanProcessor(otlpExporter)],
        });

        // Register the provider
        this.provider.register({
            contextManager: new ZoneContextManager(),
        });

        // Create an initial span to verify tracing is working
        const tracer = this.provider.getTracer('frontend-tracer');
        const span = tracer.startSpan('frontend.page.load');
        span.setAttribute('page.url', globalThis.location.href);
        span.end();

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
