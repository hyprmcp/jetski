package env

import (
	"fmt"
	"github.com/jetski-sh/jetski/internal/envparse"
	"github.com/jetski-sh/jetski/internal/envutil"
	"github.com/joho/godotenv"
	"os"
	"strconv"
	"time"
)

var (
	databaseUrl                   string
	databaseMaxConns              *int
	sentryDSN                     string
	sentryDebug                   bool
	sentryEnvironment             string
	otelAgentSampler              *SamplerConfig
	otelRegistrySampler           *SamplerConfig
	otelExporterSentryEnabled     bool
	otelExporterOtlpEnabled       bool
	enableQueryLogging            bool
	frontendSentryDSN             *string
	frontendSentryTraceSampleRate *float64
	frontendPosthogToken          *string
	frontendPosthogAPIHost        *string
	frontendPosthogUIHost         *string
	serverShutdownDelayDuration   *time.Duration
)

func Initialize() {
	if currentEnv, ok := os.LookupEnv("JETSKI_ENV"); ok {
		fmt.Fprintf(os.Stderr, "environment=%v\n", currentEnv)
		if err := godotenv.Load(currentEnv); err != nil {
			fmt.Fprintf(os.Stderr, "environment %v not loaded: %v\n", currentEnv, err)
		}
	}

	databaseUrl = envutil.RequireEnv("DATABASE_URL")
	databaseMaxConns = envutil.GetEnvParsedOrNil("DATABASE_MAX_CONNS", strconv.Atoi)
	enableQueryLogging = envutil.GetEnvParsedOrDefault("ENABLE_QUERY_LOGGING", strconv.ParseBool, false)
	serverShutdownDelayDuration = envutil.GetEnvParsedOrNil("SERVER_SHUTDOWN_DELAY_DURATION", envparse.PositiveDuration)

	sentryDSN = envutil.GetEnv("SENTRY_DSN")
	sentryDebug = envutil.GetEnvParsedOrDefault("SENTRY_DEBUG", strconv.ParseBool, false)
	sentryEnvironment = envutil.GetEnv("SENTRY_ENVIRONMENT")
	otelExporterSentryEnabled = envutil.GetEnvParsedOrDefault("OTEL_EXPORTER_SENTRY_ENABLED", strconv.ParseBool, false)
	otelExporterOtlpEnabled = envutil.GetEnvParsedOrDefault("OTEL_EXPORTER_OTLP_ENABLED", strconv.ParseBool, false)
	if s := envutil.GetEnvParsedOrNil("OTEL_AGENT_SAMPLER", parseSamplerType); s != nil {
		otelAgentSampler = &SamplerConfig{
			Sampler: *s,
			Arg:     envutil.GetEnvParsedOrDefault("OTEL_AGENT_SAMPLER_ARG", envparse.Float, 1.0),
		}
	}
	if s := envutil.GetEnvParsedOrNil("OTEL_REGISTRY_SAMPLER", parseSamplerType); s != nil {
		otelRegistrySampler = &SamplerConfig{
			Sampler: *s,
			Arg:     envutil.GetEnvParsedOrDefault("OTEL_REGISTRY_SAMPLER_ARG", envparse.Float, 1.0),
		}
	}

	frontendSentryDSN = envutil.GetEnvOrNil("FRONTEND_SENTRY_DSN")
	frontendSentryTraceSampleRate = envutil.GetEnvParsedOrNil("FRONTEND_SENTRY_TRACE_SAMPLE_RATE", envparse.Float)
	frontendPosthogToken = envutil.GetEnvOrNil("FRONTEND_POSTHOG_TOKEN")
	frontendPosthogAPIHost = envutil.GetEnvOrNil("FRONTEND_POSTHOG_API_HOST")
	frontendPosthogUIHost = envutil.GetEnvOrNil("FRONTEND_POSTHOG_UI_HOST")
}

func DatabaseUrl() string {
	return databaseUrl
}

// DatabaseMaxConns allows to override the MaxConns parameter of the pgx pool config.
//
// Note that it should also be possible to set this value via the connection string
// (like this: postgresql://...?pool_max_conns=10), but it doesn't work for some reason.
func DatabaseMaxConns() *int {
	return databaseMaxConns
}

func SentryDSN() string {
	return sentryDSN
}

func SentryDebug() bool {
	return sentryDebug
}

func SentryEnvironment() string {
	return sentryEnvironment
}

func EnableQueryLogging() bool {
	return enableQueryLogging
}

func FrontendSentryDSN() *string {
	return frontendSentryDSN
}

func FrontendSentryTraceSampleRate() *float64 {
	return frontendSentryTraceSampleRate
}

func FrontendPosthogToken() *string {
	return frontendPosthogToken
}

func FrontendPosthogAPIHost() *string {
	return frontendPosthogAPIHost
}

func FrontendPosthogUIHost() *string {
	return frontendPosthogUIHost
}

func ServerShutdownDelayDuration() *time.Duration {
	return serverShutdownDelayDuration
}

func OtelAgentSampler() *SamplerConfig {
	return otelAgentSampler
}

func OtelRegistrySampler() *SamplerConfig {
	return otelRegistrySampler
}

func OtelExporterSentryEnabled() bool {
	return otelExporterSentryEnabled
}

func OtelExporterOtlpEnabled() bool {
	return otelExporterOtlpEnabled
}
