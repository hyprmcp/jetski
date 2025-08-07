package cmd

import (
	"context"
	"encoding/json"
	"fmt"
	"math/rand"
	"os"
	"time"

	internalctx "github.com/jetski-sh/jetski/internal/context"
	"github.com/jetski-sh/jetski/internal/db"
	"github.com/jetski-sh/jetski/internal/env"
	"github.com/jetski-sh/jetski/internal/svc"
	"github.com/jetski-sh/jetski/internal/types"
	"github.com/jetski-sh/jetski/internal/util"
	"github.com/sourcegraph/jsonrpc2"
	"github.com/spf13/cobra"
	"gopkg.in/yaml.v3"
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
	Organizations []testOrganization `yaml:"organizations"`
}

type testOrganization struct {
	Name     string        `yaml:"name"`
	User     string        `yaml:"user"`
	Projects []testProject `yaml:"projects"`
}

type testProject struct {
	Name                string                   `yaml:"name"`
	DeploymentRevisions []testDeploymentRevision `yaml:"deploymentRevisions"`
}

type testDeploymentRevision struct {
	Port       int                 `yaml:"port"`
	OCIUrl     string              `yaml:"ociUrl"`
	Ago        string              `yaml:"ago"`
	RandomLogs int                 `yaml:"randomLogs"`
	Logs       []testMCPServerLog  `yaml:"logs"`
	Events     []testRevisionEvent `yaml:"events"`
}

type testRevisionEvent struct {
	Type string `yaml:"type"`
	Ago  string `yaml:"ago"`
}

type testMCPServerLog struct {
	Method     string                 `yaml:"method"`
	UserAgent  string                 `yaml:"userAgent"`
	HttpStatus int                    `yaml:"httpStatus"`
	Parameters []testMCPToolParameter `yaml:"parameters"`
}

type testMCPToolParameter struct {
	Name      string                `yaml:"name"`
	Arguments []testMCPToolArgument `yaml:"arguments"`
}

type testMCPToolArgument struct {
	Name  string `yaml:"name"`
	Value string `yaml:"value"`
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
		// Local user cache to avoid repeated database queries
		userCache := make(map[string]*types.UserAccount)

		// Pre-populate user cache with all existing users
		existingUsers, err := db.GetAllUsers(ctx)
		if err != nil {
			return fmt.Errorf("failed to get all users: %w", err)
		}
		for _, user := range existingUsers {
			userCopy := user // Create a copy to avoid pointer issues
			userCache[user.Email] = &userCopy
		}
		fmt.Printf("Pre-loaded %d existing users into cache\n", len(existingUsers))

		// organization loop
		for _, orgData := range data.Organizations {
			var user *types.UserAccount
			var err error
			if cachedUser, exists := userCache[orgData.User]; exists {
				user = cachedUser
			} else {
				user, err = db.CreateUser(ctx, orgData.User)
				if err != nil {
					return fmt.Errorf("failed to create user: %w", err)
				}
				userCache[orgData.User] = user
			}

			// Check if user already has an organization with this name
			userOrgs, err := db.GetOrganizationsOfUser(ctx, user.ID)
			if err != nil {
				return fmt.Errorf("failed to get user organizations: %w", err)
			}

			// Look for existing organization with the same name
			var org *types.Organization
			for _, userOrg := range userOrgs {
				if userOrg.Name == orgData.Name {
					orgCopy := userOrg
					org = &orgCopy
					break
				}
			}

			if org != nil {
				// Use existing organization
				fmt.Printf("Using existing organization: %s\n", org.Name)
			} else {
				// Create new organization and add user to it
				org, err = db.CreateOrganization(ctx, orgData.Name)
				if err != nil {
					return fmt.Errorf("failed to create org: %w", err)
				}
				if err := db.AddUserToOrganization(ctx, user.ID, org.ID); err != nil {
					return fmt.Errorf("failed to add user to org: %w", err)
				}
				fmt.Printf("Created organization: %s\n", org.Name)
			}

			// project loop
			for _, projData := range orgData.Projects {
				// Check if user already has a project with this name
				userProjects, err := db.GetProjectsForUser(ctx, user.ID)
				if err != nil {
					return fmt.Errorf("failed to get user projects: %w", err)
				}

				// Look for existing project with the same name in the same organization
				var proj *types.Project
				for _, userProject := range userProjects {
					if userProject.Name == projData.Name && userProject.OrganizationID == org.ID {
						projCopy := userProject
						proj = &projCopy
						break
					}
				}

				if proj != nil {
					// Use existing project
					fmt.Printf("  Using existing project: %s\n", proj.Name)
				} else {
					// Create new project
					proj, err = db.CreateProject(ctx, org.ID, user.ID, projData.Name)
					if err != nil {
						return fmt.Errorf("failed to create project: %w", err)
					}
					fmt.Printf("  Created project: %s\n", proj.Name)
				}
				for _, drData := range projData.DeploymentRevisions {
					ago, err := time.ParseDuration(drData.Ago)
					if err != nil {
						return fmt.Errorf("failed to parse duration: %w", err)
					}
					ts := time.Now().UTC().Add(ago * -1)
					// TODO support proxied and unauthenticated deployment revisions in demo data
					dr, err := db.CreateHostedDeploymentRevision(ctx, proj.ID, user.ID, drData.Port, drData.OCIUrl, true, &ts)
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
					for i := 0; i < drData.RandomLogs; i++ {
						// Generate random timestamp within last 48 hours
						randomHours := rand.Float64() * 48
						randomTimestamp := time.Now().UTC().Add(-time.Duration(randomHours * float64(time.Hour)))

						log := types.MCPServerLog{
							UserAccountID:        &user.ID,
							MCPSessionID:         util.PtrTo("mcp-session-id-xyz lorem ipsum whatever lorem ipsum whatever"),
							StartedAt:            randomTimestamp,
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

					// Create actual logs based on testMCPServerLog array
					for j, logData := range drData.Logs {
						// Build the JSON params based on the YAML structure
						var params interface{}
						if len(logData.Parameters) > 0 {
							// For Tools/Call method with parameters
							param := logData.Parameters[0] // Take the first parameter
							arguments := make(map[string]interface{})
							for _, arg := range param.Arguments {
								arguments[arg.Name] = arg.Value
							}
							params = map[string]interface{}{
								"_meta": map[string]interface{}{
									"progressToken": 4,
								},
								"arguments": arguments,
								"name":      param.Name,
							}
						} else {
							// For Tools/List method with no parameters
							params = map[string]interface{}{
								"_meta": map[string]interface{}{
									"progressToken": 4,
								},
							}
						}

						paramsBytes, err := json.Marshal(params)
						if err != nil {
							return fmt.Errorf("failed to marshal params: %w", err)
						}

						// Generate random timestamp within last 48 hours
						randomHours := rand.Float64() * 48
						randomTimestamp := time.Now().UTC().Add(-time.Duration(randomHours * float64(time.Hour)))

						log := types.MCPServerLog{
							UserAccountID:        &user.ID,
							MCPSessionID:         util.PtrTo("mcp-session-id-" + fmt.Sprintf("%d", j)),
							StartedAt:            randomTimestamp,
							Duration:             time.Duration(rand.Intn(500)+100) * time.Millisecond,
							DeploymentRevisionID: dr.ID,
							AuthTokenDigest:      nil,
							MCPRequest: jsonrpc2.Request{
								Method: logData.Method,
								Params: (*json.RawMessage)(&paramsBytes),
								ID:     jsonrpc2.ID{Num: uint64(j + 1000)},
								Notif:  false,
							},
							MCPResponse: jsonrpc2.Response{
								ID:     jsonrpc2.ID{Num: uint64(j + 1000)},
								Result: nil,
								Error:  &jsonrpc2.Error{},
							},
							UserAgent:      util.PtrTo(logData.UserAgent),
							HttpStatusCode: util.PtrTo(logData.HttpStatus),
							HttpError:      nil,
						}
						err = db.CreateMCPServerLog(ctx, &log)
						if err != nil {
							return fmt.Errorf("failed to create mcp server log from yaml: %w", err)
						}
						fmt.Printf("      Created log: %s\n", logData.Method)
					}

				}

			}
		}
		return nil
	}))
}
