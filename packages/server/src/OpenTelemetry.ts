import api, { type Tracer } from '@opentelemetry/api';
import { AsyncHooksContextManager } from '@opentelemetry/context-async-hooks';
import { CompositePropagator } from '@opentelemetry/core';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { GraphQLInstrumentation } from '@opentelemetry/instrumentation-graphql';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { B3InjectEncoding, B3Propagator } from '@opentelemetry/propagator-b3';
import { JaegerPropagator } from '@opentelemetry/propagator-jaeger';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  BatchSpanProcessor,
  ConsoleSpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { PrismaInstrumentation } from '@prisma/instrumentation';

const setup = (): Tracer => {
  const exportUrl = process.env.BOOKREADER_TRACE_URL;

  const contextManager = new AsyncHooksContextManager().enable();
  api.context.setGlobalContextManager(contextManager);
  switch (process.env.BOOKREADER_TRACE_PROPAGATOR) {
    case 'b3':
      api.propagation.setGlobalPropagator(
        new CompositePropagator({
          propagators: [
            new B3Propagator(),
            new B3Propagator({ injectEncoding: B3InjectEncoding.MULTI_HEADER }),
          ],
        }),
      );
      break;
    case 'jaeger':
      api.propagation.setGlobalPropagator(new JaegerPropagator());
      break;
    default:
      break;
  }

  const serviceName =
    process.env.BOOKREADER_TRACE_SERVICE_NAME ?? 'book-reader';
  const spanProcessors = [];
  if (exportUrl) {
    const otlpTraceExporter = new OTLPTraceExporter({ url: exportUrl });
    spanProcessors.push(new BatchSpanProcessor(otlpTraceExporter));
  }
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.BOOKREADER_TRACE_CONSOLE === 'true'
  ) {
    spanProcessors.push(new SimpleSpanProcessor(new ConsoleSpanExporter()));
  }

  const provider = new NodeTracerProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
    }),
    spanProcessors,
  });

  provider.register();

  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new GraphQLInstrumentation(),
      new PrismaInstrumentation(),
    ],
  });

  return api.trace.getTracer(serviceName);
};

export const tracer: Tracer = setup();
