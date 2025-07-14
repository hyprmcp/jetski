package serve

import (
	"context"
	"os/signal"
	"syscall"
	"time"

	"github.com/getsentry/sentry-go"
	"github.com/jetski-sh/jetski/internal/buildconfig"
	"github.com/jetski-sh/jetski/internal/env"
	"github.com/jetski-sh/jetski/internal/svc"
	"github.com/jetski-sh/jetski/internal/util"
	"github.com/spf13/cobra"
)

type ServeOptions struct{ Migrate bool }

var serveOpts = ServeOptions{Migrate: true}

var ServeCommand = &cobra.Command{
	Use:    "serve",
	Short:  "run the jetski server",
	Args:   cobra.NoArgs,
	PreRun: func(cmd *cobra.Command, args []string) { env.Initialize() },
	Run: func(cmd *cobra.Command, args []string) {
		runServe(cmd.Context(), serveOpts)
	},
}

func init() {
	ServeCommand.Flags().BoolVar(&serveOpts.Migrate, "migrate", serveOpts.Migrate,
		"run database migrations before starting the server")

	RootCommand.AddCommand(ServeCommand)
}

func runServe(ctx context.Context, opts ServeOptions) {
	util.Must(sentry.Init(sentry.ClientOptions{
		Dsn:              env.SentryDSN(),
		Debug:            env.SentryDebug(),
		Environment:      env.SentryEnvironment(),
		EnableTracing:    env.OtelExporterSentryEnabled(),
		TracesSampleRate: 1.0,
		Release:          buildconfig.Version(),
	}))
	defer sentry.Flush(5 * time.Second)
	defer func() {
		if err := recover(); err != nil {
			sentry.CurrentHub().RecoverWithContext(ctx, err)
			panic(err)
		}
	}()

	registry := util.Require(svc.New(ctx, svc.ExecDbMigration(opts.Migrate)))
	defer func() { util.Must(registry.Shutdown(ctx)) }()

	server := registry.GetServer()

	sigCtx, _ := signal.NotifyContext(ctx, syscall.SIGTERM, syscall.SIGINT)
	context.AfterFunc(sigCtx, func() {
		ctx, cancel := context.WithTimeout(ctx, 30*time.Second)
		server.Shutdown(ctx)
		cancel()
	})

	go func() { util.Must(server.Start(":8080")) }()
	server.WaitForShutdown()
}
