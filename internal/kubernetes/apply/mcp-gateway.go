package apply

import (
	"context"
	"fmt"

	internalctx "github.com/hyprmcp/jetski/internal/context"
	"github.com/hyprmcp/jetski/internal/db"
	"github.com/hyprmcp/jetski/internal/env"
	api "github.com/hyprmcp/jetski/internal/kubernetes/api/v1alpha1"
	applyconfig "github.com/hyprmcp/jetski/internal/kubernetes/applyconfiguration/api/v1alpha1"
	"github.com/hyprmcp/jetski/internal/types"
	"github.com/hyprmcp/jetski/internal/util"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type mcpGatewayApplier struct {
	client client.Client
}

func MCPGateway(client client.Client) *mcpGatewayApplier {
	return &mcpGatewayApplier{client: client}
}

func (a *mcpGatewayApplier) Apply(ctx context.Context, org types.Organization) error {
	log := internalctx.GetLogger(ctx)
	var gatewayProjects []*applyconfig.ProjectSpecApplyConfiguration
	if pss, err := db.GetProjectSummaries(ctx, org.ID); err != nil {
		return err
	} else if len(pss) == 0 {
		log.Info("org has no projects. deleting gateway")

		err := a.client.Delete(
			ctx,
			&api.MCPGateway{ObjectMeta: metav1.ObjectMeta{Name: org.Name, Namespace: env.GatewayNamespace()}},
			client.PropagationPolicy(metav1.DeletePropagationBackground),
		)
		if err != nil && !errors.IsNotFound(err) {
			return fmt.Errorf("failed to delete gateway: %w", err)
		} else {
			return nil
		}
	} else {
		for _, ps := range pss {
			if ps.LatestDeploymentRevisionID == nil {
				continue
			}
			spec := applyconfig.ProjectSpec().
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

	spec := applyconfig.MCPGatewaySpec().
		WithOrganizationID(org.ID.String()).
		WithOrganizationName(org.Name).
		WithAuthorization(
			applyconfig.AuthorizationSpec().
				WithDynamicClientRegistration(
					applyconfig.DynamicClientRegistrationSpec().
						WithPublicClient(org.Settings.Authorization.DCRPublicClient),
				),
		).
		WithProjects(gatewayProjects...)

	if org.Settings.CustomDomain != nil {
		spec.WithCustomDomain(*org.Settings.CustomDomain)
	}

	err := a.client.Apply(
		ctx,
		applyconfig.MCPGateway(org.Name, env.GatewayNamespace()).WithSpec(spec),
		&client.ApplyOptions{Force: util.PtrTo(true), FieldManager: "jetski"},
	)

	if err != nil {
		return fmt.Errorf("MCPGateway apply failed: %w", err)
	}

	return nil
}
