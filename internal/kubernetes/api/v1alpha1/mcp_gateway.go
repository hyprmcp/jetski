package v1alpha1

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type MCPGatewayProject struct {
	// TODO: Use uuid.UUID instead but controller-gen does not like it when generating deep-copy functions
	ProjectID            string  `json:"projectId"`
	ProjectName          string  `json:"projectName"`
	DeploymentRevisionID string  `json:"deploymentRevisionId"`
	Authenticated        bool    `json:"authenticationEnabled"`
	Telemetry            bool    `json:"telemetryEnabled"`
	ProxyURL             *string `json:"proxyUrl,omitempty"`
}

// MCPGatewaySpec defines the desired state of MCPGateway
type MCPGatewaySpec struct {
	OrganizationID   string              `json:"organizationId"`
	OrganizationName string              `json:"organizationName"`
	Projects         []MCPGatewayProject `json:"projects,omitempty"`
}

// MCPGatewayStatus defines the observed state of MCPGateway
type MCPGatewayStatus struct{}

//+kubebuilder:object:root=true
//+kubebuilder:subresource:status
//+kubebuilder:resource:path=mcpgateways,scope=Namespaced,shortName=mcpg

// MCPGateway is the Schema for the mcpgateways API
type MCPGateway struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata"`

	Spec   MCPGatewaySpec   `json:"spec,omitempty"`
	Status MCPGatewayStatus `json:"status,omitempty"`
}

//+kubebuilder:object:root=true

// MCPGatewayList contains a list of MCPGateway
type MCPGatewayList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata"`
	Items           []MCPGateway `json:"items"`
}

func init() {
	SchemeBuilder.Register(&MCPGateway{}, &MCPGatewayList{})
}
