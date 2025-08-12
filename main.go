package main

import (
	"os"

	"github.com/jetski-sh/jetski/internal/cmd"
)

func main() {
	if err := cmd.NewRoot().Execute(); err != nil {
		os.Exit(1)
	}
}
