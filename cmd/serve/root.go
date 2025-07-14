package serve

import (
	"github.com/jetski-sh/jetski/internal/buildconfig"
	"github.com/spf13/cobra"
)

var RootCommand = &cobra.Command{
	Use:     "jetski",
	Version: buildconfig.Version(),
}
