package svc

import (
	"context"

	sentryotel "github.com/getsentry/sentry-go/otel"
	"github.com/go-logr/zapr"
	"github.com/hyprmcp/jetski/internal/env"
	"github.com/hyprmcp/jetski/internal/tracers"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/trace"
)

func (r *Registry) GetTracers() *tracers.Tracers {
	return r.tracers
}

func (reg *Registry) createTracer(ctx context.Context) (*tracers.Tracers, error) {
	otel.SetLogger(zapr.NewLogger(reg.logger))

	tpopts := []trace.TracerProviderOption{}
	tmps := []propagation.TextMapPropagator{propagation.TraceContext{}, propagation.Baggage{}}

	if env.OtelExporterOtlpEnabled() {
		if exp, err := otlptracegrpc.New(ctx); err != nil {
			return nil, err
		} else {
			tpopts = append(tpopts, trace.WithSpanProcessor(trace.NewBatchSpanProcessor(exp)))
		}
	}

	if env.OtelExporterSentryEnabled() {
		tpopts = append(tpopts, trace.WithSpanProcessor(sentryotel.NewSentrySpanProcessor()))
		tmps = append(tmps, sentryotel.NewSentryPropagator())
	}

	tracers := tracers.Tracers{
		DefaultProvider: trace.NewTracerProvider(tpopts...),
		AlwaysProvider:  trace.NewTracerProvider(append(tpopts, trace.WithSampler(trace.AlwaysSample()))...),
	}

	otel.SetTracerProvider(tracers.DefaultProvider)
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(tmps...))

	return &tracers, nil
}
