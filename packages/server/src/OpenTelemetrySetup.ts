import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { AsyncHooksContextManager } from '@opentelemetry/context-async-hooks';
import * as api from '@opentelemetry/api';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import {
  BatchSpanProcessor,
  ConsoleSpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { Resource } from '@opentelemetry/resources';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { PrismaInstrumentation } from '@prisma/instrumentation';
import { GraphQLInstrumentation } from '@opentelemetry/instrumentation-graphql';

export const setup = () => {
  const exportUrl = process.env.BOOKREADER_TRACE_URL;
  if (!exportUrl) {
    return;
  }

  const contextManager = new AsyncHooksContextManager().enable();
  api.context.setGlobalContextManager(contextManager);

  const serviceName = process.env.BOOKREADER_TRACE_SERVICE_NAME ?? 'book-reader';
  const provider = new NodeTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    }),
  });

  const otlpTraceExporter = new OTLPTraceExporter({ url: exportUrl });
  provider.addSpanProcessor(new BatchSpanProcessor(otlpTraceExporter));
  if (process.env.NODE_ENV !== 'production') {
    provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
  }

  provider.register();

  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new GraphQLInstrumentation(),
      new PrismaInstrumentation({ middleware: true }),
    ],
  });
};

setup();
