import { NodeTracerProvider } from '@opentelemetry/node';
import { BatchSpanProcessor } from '@opentelemetry/tracing';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { Resource } from '@opentelemetry/resources';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { KoaInstrumentation } from '@opentelemetry/instrumentation-koa';
import { GraphQLInstrumentation } from '@opentelemetry/instrumentation-graphql';
import { ZipkinExporter } from '@opentelemetry/exporter-zipkin';

import opentelemetry, { Span as OTSpan } from '@opentelemetry/api';
import { OTEL_GRAPHQL_DATA_SYMBOL } from '@opentelemetry/instrumentation-graphql/build/src/symbols';

const serviceName = 'book-reader';

export type Span = OTSpan;
type Context = unknown;
const tracer = opentelemetry.trace.getTracer(serviceName);
const getSpan = (context: Context): Span | undefined => context?.[OTEL_GRAPHQL_DATA_SYMBOL]?.span;

export const startSpan = (parentSpan: Span, spanName: Lowercase<string>): Span => {
  const ctx = opentelemetry.trace.setSpan(opentelemetry.context.active(), parentSpan);
  return tracer.startSpan(spanName, undefined, ctx);
};
export const startSpanFromContext = (
  context: Context,
  spanName: Lowercase<string>,
): Span | undefined => {
  const parentSpan = getSpan(context);
  if (!parentSpan) {
    return undefined;
  }
  return startSpan(parentSpan, spanName);
};

const zipkinEndpoint = process.env.ZIPKIN_ENDPOINT;
if (zipkinEndpoint) {
  registerInstrumentations({
    instrumentations: [
      new HttpInstrumentation(),
      new KoaInstrumentation(),
      new GraphQLInstrumentation(),
    ],
  });

  const provider = new NodeTracerProvider({
    resource: Resource.default()
      .merge(new Resource({
        'service.name': serviceName,
      })),
  });

  provider.addSpanProcessor(
    new BatchSpanProcessor(
      new ZipkinExporter({
        url: zipkinEndpoint,
      }),
    ),
  );

  provider.register();
}
