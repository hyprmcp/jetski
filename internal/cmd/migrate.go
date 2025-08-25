package cmd

import (
	"context"

	"github.com/hyprmcp/jetski/internal/env"
	"github.com/hyprmcp/jetski/internal/migrations"
	"github.com/hyprmcp/jetski/internal/svc"
	"github.com/hyprmcp/jetski/internal/util"
	"github.com/spf13/cobra"
)

type migrateOptions struct {
	Down bool
	To   uint
}

func NewMigrateCommand() *cobra.Command {
	opts := migrateOptions{}

	cmd := &cobra.Command{
		Use:    "migrate",
		Short:  "execute database migrations",
		Args:   cobra.NoArgs,
		PreRun: func(cmd *cobra.Command, args []string) { env.Initialize() },
		Run: func(cmd *cobra.Command, args []string) {
			runMigrate(cmd.Context(), opts)
		},
	}

	cmd.Flags().BoolVar(&opts.Down, "down", opts.Down, "run all down migrations. DANGER: This will purge the database!")
	cmd.Flags().UintVar(&opts.To, "to", opts.To, "run all up/down migrations to reach specified schema revision")
	cmd.MarkFlagsMutuallyExclusive("down", "to")

	return cmd
}

func runMigrate(ctx context.Context, opts migrateOptions) {
	registry := util.Require(svc.NewDefault(ctx))
	defer func() { util.Must(registry.Shutdown(ctx)) }()
	if opts.To > 0 {
		registry.GetLogger().Sugar().Infof("run migrations to schema version %v", opts.To)
		util.Must(migrations.Migrate(registry.GetLogger(), opts.To))
	} else if opts.Down {
		registry.GetLogger().Info("run DOWN migrations")
		util.Must(migrations.Down(registry.GetLogger()))
	} else {
		registry.GetLogger().Info("run UP migrations")
		util.Must(migrations.Up(registry.GetLogger()))
	}
}
