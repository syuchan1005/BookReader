import { NodeTracerProvider } from '@opentelemetry/node';
import { BatchSpanProcessor } from '@opentelemetry/tracing';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { Resource } from '@opentelemetry/resources';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { KoaInstrumentation } from '@opentelemetry/instrumentation-koa';
import { GraphQLInstrumentation } from '@opentelemetry/instrumentation-graphql';
import { ZipkinExporter } from '@opentelemetry/exporter-zipkin';

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
        'service.name': 'book-reader',
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
