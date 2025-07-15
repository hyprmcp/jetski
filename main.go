package main

import (
	"github.com/jetski-sh/jetski/internal/cmd"
	"os"
)

func main() {
	if err := cmd.NewRoot().Execute(); err != nil {
		os.Exit(1)
	}
}
