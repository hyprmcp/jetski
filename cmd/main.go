package main

import (
	"github.com/jetski-sh/jetski/cmd/serve"
	"os"
)

func main() {
	if err := serve.RootCommand.Execute(); err != nil {
		os.Exit(1)
	}
}
