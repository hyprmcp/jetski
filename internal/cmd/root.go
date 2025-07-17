package cmd

import (
	"github.com/jetski-sh/jetski/internal/buildconfig"
	"github.com/spf13/cobra"
)

func NewRoot() *cobra.Command {
	cmd := &cobra.Command{
		Use:     "jetski",
		Version: buildconfig.Version(),
	}

	cmd.AddCommand(
		NewServeCommand(),
		NewMigrateCommand(),
		NewGenerateCommand(),
	)

	return cmd
}
