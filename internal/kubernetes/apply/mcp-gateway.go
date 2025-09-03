package apply

import (
	"context"
	"fmt"

	"github.com/hyprmcp/jetski/internal/db"
	"github.com/hyprmcp/jetski/internal/env"
	"github.com/hyprmcp/jetski/internal/kubernetes/applyconfiguration/api/v1alpha1"
	"github.com/hyprmcp/jetski/internal/types"
	"github.com/hyprmcp/jetski/internal/util"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type mcpGatewayApplier struct {
	client client.Client
}

func MCPGateway(client client.Client) *mcpGatewayApplier {
	return &mcpGatewayApplier{client: client}
}

func (a *mcpGatewayApplier) Apply(ctx context.Context, org types.Organization) error {
	var gatewayProjects []*v1alpha1.ProjectSpecApplyConfiguration
	if pss, err := db.GetProjectSummaries(ctx, org.ID); err != nil {
		return err
	} else {
		for _, ps := range pss {
			if ps.LatestDeploymentRevisionID == nil {
				continue
			}
			spec := v1alpha1.ProjectSpec().
				WithProjectID(ps.ID.String()).
				WithProjectName(ps.Name).
				WithDeploymentRevisionID(ps.LatestDeploymentRevision.ID.String()).
				WithAuthenticated(ps.LatestDeploymentRevision.Authenticated).
				WithTelemetry(ps.LatestDeploymentRevision.Telemetry)

			if ps.LatestDeploymentRevision.ProxyURL != nil {
				spec.WithProxyURL(*ps.LatestDeploymentRevision.ProxyURL)
			}

			gatewayProjects = append(gatewayProjects, spec)
		}
	}

	spec := v1alpha1.MCPGatewaySpec().
		WithOrganizationID(org.ID.String()).
		WithOrganizationName(org.Name).
		WithAuthorization(
			v1alpha1.AuthorizationSpec().
				WithDynamicClientRegistration(
					v1alpha1.DynamicClientRegistrationSpec().
						WithPublicClient(org.Settings.Authorization.DCRPublicClient),
				),
		).
		WithProjects(gatewayProjects...)

	if org.Settings.CustomDomain != nil {
		spec.WithCustomDomain(*org.Settings.CustomDomain)
	}

	err := a.client.Apply(
		ctx,
		v1alpha1.MCPGateway(org.Name, env.GatewayNamespace()).WithSpec(spec),
		&client.ApplyOptions{Force: util.PtrTo(true), FieldManager: "jetski"},
	)

	if err != nil {
		return fmt.Errorf("MCPGateway apply failed: %w", err)
	}

	return nil
}
