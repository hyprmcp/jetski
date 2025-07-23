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
	"github.com/sourcegraph/jsonrpc2"
	"github.com/spf13/cobra"
	"gopkg.in/yaml.v3"
	"math/rand"
	"os"
	"time"
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
	Ago    string              `yaml:"ago"`
	Logs   int                 `yaml:"logs"`
	Events []testRevisionEvent `yaml:"events"`
}

type testRevisionEvent struct {
	Type string `yaml:"type"`
	Ago  string `yaml:"ago"`
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
					ago, err := time.ParseDuration(drData.Ago)
					if err != nil {
						return fmt.Errorf("failed to parse duration: %w", err)
					}
					ts := time.Now().UTC().Add(ago * -1)
					dr, err := db.CreateDeploymentRevision(ctx, proj.ID, user.ID, drData.Port, drData.OCIUrl, &ts)
					if err != nil {
						return fmt.Errorf("failed to create deployment revision: %w", err)
					}
					fmt.Printf("    Created deployment revision: %s\n", dr.ID)
					for _, eventData := range drData.Events {
						ago, err := time.ParseDuration(eventData.Ago)
						if err != nil {
							return fmt.Errorf("failed to parse duration: %w", err)
						}
						ts := time.Now().UTC().Add(ago * -1)
						err = db.AddDeploymentRevisionEvent(ctx, dr.ID, types.DeploymentRevisionEventType(eventData.Type), &ts)
						if err != nil {
							return fmt.Errorf("failed to add deployment revision event: %w", err)
						}
						fmt.Printf("      Added event: %s\n", eventData.Type)
					}
					for i := 0; i < drData.Logs; i++ {
						log := types.MCPServerLog{
							UserAccountID:        &user.ID,
							MCPSessionID:         util.PtrTo("mcp-session-id-xyz lorem ipsum whatever lorem ipsum whatever"),
							StartedAt:            time.Now().UTC().Add(time.Duration((5 * time.Second).Nanoseconds() * int64(i))),
							Duration:             time.Duration(rand.Intn(1300)) * time.Millisecond,
							DeploymentRevisionID: dr.ID,
							AuthTokenDigest:      nil,
							MCPRequest: jsonrpc2.Request{
								Method: fmt.Sprintf("method-%v", i),
								Params: nil,
								ID:     jsonrpc2.ID{Num: uint64(i)},
								Notif:  false,
							},
							MCPResponse: jsonrpc2.Response{
								ID:     jsonrpc2.ID{Num: uint64(i)},
								Result: nil,
								Error:  &jsonrpc2.Error{},
							},
							UserAgent:      util.PtrTo("some-user-agent 4711 lorem ipsum whatever"),
							HttpStatusCode: util.PtrTo(200),
							HttpError:      nil,
						}
						err := db.CreateMCPServerLog(ctx, &log)
						if err != nil {
							return fmt.Errorf("failed to create mcp server log: %w", err)
						}
					}
				}
			}
		}
		return nil
	}))
}
