package cmd

import (
	"context"
	"fmt"
	internalctx "github.com/jetski-sh/jetski/internal/context"
	"github.com/jetski-sh/jetski/internal/db"
	"github.com/jetski-sh/jetski/internal/env"
	"github.com/jetski-sh/jetski/internal/svc"
	"github.com/jetski-sh/jetski/internal/types"
	"github.com/jetski-sh/jetski/internal/util"
	"github.com/spf13/cobra"
	"gopkg.in/yaml.v3"
	"os"
)

type generateOptions struct{}

func NewGenerateCommand() *cobra.Command {
	opts := generateOptions{}

	cmd := &cobra.Command{
		Use:    "generate",
		Args:   cobra.NoArgs,
		PreRun: func(cmd *cobra.Command, args []string) { env.Initialize() },
		Run: func(cmd *cobra.Command, args []string) {
			runGenerate(cmd.Context(), opts)
		},
	}

	return cmd
}

// Test data structs

type testData struct {
	User          string             `yaml:"user"`
	Organizations []testOrganization `yaml:"organizations"`
}

type testOrganization struct {
	Name     string        `yaml:"name"`
	Projects []testProject `yaml:"projects"`
}

type testProject struct {
	Name                string                   `yaml:"name"`
	DeploymentRevisions []testDeploymentRevision `yaml:"deploymentRevisions"`
}

type testDeploymentRevision struct {
	Port   int                 `yaml:"port"`
	OCIUrl string              `yaml:"ociUrl"`
	Events []testRevisionEvent `yaml:"events"`
}

type testRevisionEvent struct {
	Type string `yaml:"type"`
}

func runGenerate(ctx context.Context, opts generateOptions) {
	// Read test-data.yaml
	f, err := os.Open("test-data.yaml")
	if err != nil {
		panic(fmt.Errorf("failed to open test-data.yaml: %w", err))
	}
	defer func(f *os.File) { _ = f.Close() }(f)
	var data testData
	if err := yaml.NewDecoder(f).Decode(&data); err != nil {
		panic(fmt.Errorf("failed to decode test-data.yaml: %w", err))
	}

	registry := util.Require(svc.New(ctx, svc.ExecDbMigration(true)))
	defer func() { util.Must(registry.Shutdown(ctx)) }()
	ctx = internalctx.WithDb(ctx, registry.GetDbPool())

	util.Must(db.RunTx(ctx, func(ctx context.Context) error {
		user, err := db.CreateUser(ctx, data.User)
		if err != nil {
			return fmt.Errorf("failed to create user: %w", err)
		}
		for _, orgData := range data.Organizations {
			org, err := db.CreateOrganization(ctx, orgData.Name)
			if err != nil {
				return fmt.Errorf("failed to create org: %w", err)
			} else if err := db.AddUserToOrganization(ctx, user.ID, org.ID); err != nil {
				return fmt.Errorf("failed to add user to org: %w", err)
			}
			fmt.Printf("Created organization: %s\n", org.Name)
			for _, projData := range orgData.Projects {
				proj, err := db.CreateProject(ctx, org.ID, user.ID, projData.Name)
				if err != nil {
					return fmt.Errorf("failed to create project: %w", err)
				}
				fmt.Printf("  Created project: %s\n", proj.Name)
				for _, drData := range projData.DeploymentRevisions {
					dr, err := db.CreateDeploymentRevision(ctx, proj.ID, user.ID, drData.Port, drData.OCIUrl)
					if err != nil {
						return fmt.Errorf("failed to create deployment revision: %w", err)
					}
					fmt.Printf("    Created deployment revision: %s\n", dr.ID)
					for _, eventData := range drData.Events {
						err := db.AddDeploymentRevisionEvent(ctx, dr.ID, types.DeploymentRevisionEventType(eventData.Type))
						if err != nil {
							return fmt.Errorf("failed to add deployment revision event: %w", err)
						}
						fmt.Printf("      Added event: %s\n", eventData.Type)
					}
				}
			}
		}
		return nil
	}))
}
