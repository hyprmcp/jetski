package apply

import (
	"context"
	"fmt"

	"github.com/hyprmcp/jetski/internal/db"
	"github.com/hyprmcp/jetski/internal/env"
	"github.com/hyprmcp/jetski/internal/kubernetes/api/v1alpha1"
	"github.com/hyprmcp/jetski/internal/types"
	"github.com/hyprmcp/jetski/internal/util"
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
	var gatewayProjects []v1alpha1.ProjectSpec
	if pss, err := db.GetProjectSummaries(ctx, org.ID); err != nil {
		return err
	} else {
		for _, ps := range pss {
			if ps.LatestDeploymentRevisionID == nil {
				continue
			}
			gatewayProjects = append(gatewayProjects, v1alpha1.ProjectSpec{
				ProjectID:            ps.ID.String(),
				ProjectName:          ps.Name,
				DeploymentRevisionID: ps.LatestDeploymentRevision.ID.String(),
				Authenticated:        ps.LatestDeploymentRevision.Authenticated,
				Telemetry:            ps.LatestDeploymentRevision.Telemetry,
				ProxyURL:             ps.LatestDeploymentRevision.ProxyURL,
			})
		}
	}

	err := a.client.Patch(
		ctx,
		&v1alpha1.MCPGateway{
			TypeMeta: metav1.TypeMeta{
				APIVersion: v1alpha1.GroupVersion.Identifier(),
				Kind:       "MCPGateway",
			},
			ObjectMeta: metav1.ObjectMeta{
				Name:      org.Name,
				Namespace: env.GatewayNamespace(),
			},
			Spec: v1alpha1.MCPGatewaySpec{
				OrganizationID:   org.ID.String(),
				OrganizationName: org.Name,
				Authorization: v1alpha1.AuthorizationSpec{
					DynamicClientRegistration: v1alpha1.DynamicClientRegistrationSpec{
						PublicClient: org.Settings.Authorization.DCRPublicClient,
					},
				},
				Projects: gatewayProjects,
			},
		},
		client.Apply,
		&client.PatchOptions{Force: util.PtrTo(true), FieldManager: "jetski"},
	)

	if err != nil {
		return fmt.Errorf("MCPGateway apply failed: %w", err)
	}

	return nil
}
