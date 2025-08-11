package env

import (
	"strconv"
	"time"

	"github.com/jetski-sh/jetski/internal/envparse"
	"github.com/jetski-sh/jetski/internal/envutil"
)

var (
	databaseUrl                   string
	oidcUrl                       string
	oidcClientID                  string
	databaseMaxConns              *int
	mailerConfig                  MailerConfig
	sentryDSN                     string
	sentryDebug                   bool
	sentryEnvironment             string
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
	databaseUrl = envutil.RequireEnv("DATABASE_URL")
	oidcUrl = envutil.RequireEnv("OIDC_URL")
	oidcClientID = envutil.RequireEnv("OIDC_CLIENT_ID")
	databaseMaxConns = envutil.GetEnvParsedOrNil("DATABASE_MAX_CONNS", strconv.Atoi)
	enableQueryLogging = envutil.GetEnvParsedOrDefault("ENABLE_QUERY_LOGGING", strconv.ParseBool, false)
	serverShutdownDelayDuration = envutil.GetEnvParsedOrNil("SERVER_SHUTDOWN_DELAY_DURATION", envparse.PositiveDuration)

	mailerConfig.Type = envutil.GetEnvParsedOrDefault("MAILER_TYPE", parseMailerType, MailerTypeUnspecified)
	if mailerConfig.Type != MailerTypeUnspecified {
		mailerConfig.FromAddress = envutil.RequireEnvParsed("MAILER_FROM_ADDRESS", envparse.MailAddress)
	}
	if mailerConfig.Type == MailerTypeSMTP {
		mailerConfig.SmtpConfig = &MailerSMTPConfig{
			Host:     envutil.GetEnv("MAILER_SMTP_HOST"),
			Port:     envutil.RequireEnvParsed("MAILER_SMTP_PORT", strconv.Atoi),
			Username: envutil.GetEnv("MAILER_SMTP_USERNAME"),
			Password: envutil.GetEnv("MAILER_SMTP_PASSWORD"),
		}
	}

	sentryDSN = envutil.GetEnv("SENTRY_DSN")
	sentryDebug = envutil.GetEnvParsedOrDefault("SENTRY_DEBUG", strconv.ParseBool, false)
	sentryEnvironment = envutil.GetEnv("SENTRY_ENVIRONMENT")
	otelExporterSentryEnabled = envutil.GetEnvParsedOrDefault("OTEL_EXPORTER_SENTRY_ENABLED", strconv.ParseBool, false)
	otelExporterOtlpEnabled = envutil.GetEnvParsedOrDefault("OTEL_EXPORTER_OTLP_ENABLED", strconv.ParseBool, false)

	frontendSentryDSN = envutil.GetEnvOrNil("FRONTEND_SENTRY_DSN")
	frontendSentryTraceSampleRate = envutil.GetEnvParsedOrNil("FRONTEND_SENTRY_TRACE_SAMPLE_RATE", envparse.Float)
	frontendPosthogToken = envutil.GetEnvOrNil("FRONTEND_POSTHOG_TOKEN")
	frontendPosthogAPIHost = envutil.GetEnvOrNil("FRONTEND_POSTHOG_API_HOST")
	frontendPosthogUIHost = envutil.GetEnvOrNil("FRONTEND_POSTHOG_UI_HOST")
}

func DatabaseUrl() string {
	return databaseUrl
}

func OIDCUrl() string {
	return oidcUrl
}

func OIDCClientID() string {
	return oidcClientID
}

// DatabaseMaxConns allows to override the MaxConns parameter of the pgx pool config.
//
// Note that it should also be possible to set this value via the connection string
// (like this: postgresql://...?pool_max_conns=10), but it doesn't work for some reason.
func DatabaseMaxConns() *int {
	return databaseMaxConns
}

func GetMailerConfig() MailerConfig {
	return mailerConfig
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

func OtelExporterSentryEnabled() bool {
	return otelExporterSentryEnabled
}

func OtelExporterOtlpEnabled() bool {
	return otelExporterOtlpEnabled
}
