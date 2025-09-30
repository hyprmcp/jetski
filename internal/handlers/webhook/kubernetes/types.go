package kubernetes

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"net/url"

	"github.com/hyprmcp/jetski/internal/env"
	"github.com/hyprmcp/jetski/internal/gatewayconfig"
	"github.com/hyprmcp/jetski/internal/kubernetes/api/v1alpha1"
	"github.com/hyprmcp/jetski/internal/util"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	networkingv1 "k8s.io/api/networking/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type request struct {
	Parent   v1alpha1.MCPGateway       `json:"parent"`
	Children map[string]map[string]any `json:"children"`
}

func (req *request) GetDesiredChildren() ([]client.Object, error) {
	configName := fmt.Sprintf("%v-config", req.Parent.Name)
	gatewayName := fmt.Sprintf("%v-gateway", req.Parent.Name)
	gatewayLabels := map[string]string{
		"app":                "mcp-gateway",
		"jetskiOrganization": req.Parent.Spec.OrganizationID,
	}

	gatewayConfig, err := req.GetGatewayConfig()
	if err != nil {
		return nil, err
	}

	gatewayConfigStr, err := gatewayConfig.YAMLString()
	if err != nil {
		return nil, err
	}

	gatewayConfigHash := sha256.Sum256([]byte(gatewayConfigStr))
	gatewayAnnotations := map[string]string{
		"gatewayConfigHash": hex.EncodeToString(gatewayConfigHash[:]),
	}

	// When adding resources, make sure that the resource type is also registered in the CompositeController
	// configuration at: internal/kubernetes/controller/install.go
	var result = []client.Object{
		&corev1.ConfigMap{
			TypeMeta:   metav1.TypeMeta{APIVersion: "v1", Kind: "ConfigMap"},
			ObjectMeta: metav1.ObjectMeta{Name: configName, Namespace: req.Parent.Namespace},
			Data:       map[string]string{"config.yaml": gatewayConfigStr},
		},
		&appsv1.Deployment{
			TypeMeta:   metav1.TypeMeta{APIVersion: "apps/v1", Kind: "Deployment"},
			ObjectMeta: metav1.ObjectMeta{Name: gatewayName, Namespace: req.Parent.Namespace},
			Spec: appsv1.DeploymentSpec{
				Selector: &metav1.LabelSelector{MatchLabels: gatewayLabels},
				Template: corev1.PodTemplateSpec{
					ObjectMeta: metav1.ObjectMeta{Labels: gatewayLabels, Annotations: gatewayAnnotations},
					Spec: corev1.PodSpec{
						ImagePullSecrets: []corev1.LocalObjectReference{{Name: "image-pull-secret"}},
						Containers: []corev1.Container{{
							Name:            "gateway",
							Image:           env.GatewayContainerImageTag(),
							ImagePullPolicy: corev1.PullIfNotPresent,
							Args:            []string{"--config", "/opt/config.yaml"},
							Resources: corev1.ResourceRequirements{
								Limits: corev1.ResourceList{
									corev1.ResourceMemory: resource.MustParse("128Mi"),
									corev1.ResourceCPU:    resource.MustParse("500m"),
								},
								Requests: corev1.ResourceList{
									corev1.ResourceMemory: resource.MustParse("16Mi"),
									corev1.ResourceCPU:    resource.MustParse("5m"),
								},
							},
							Ports:        []corev1.ContainerPort{{Name: "http", ContainerPort: 9000}},
							VolumeMounts: []corev1.VolumeMount{{Name: "config", SubPath: "config.yaml", MountPath: "/opt/config.yaml"}},
						}},
						Volumes: []corev1.Volume{{
							Name: "config",
							VolumeSource: corev1.VolumeSource{
								ConfigMap: &corev1.ConfigMapVolumeSource{
									LocalObjectReference: corev1.LocalObjectReference{Name: configName},
								},
							},
						}},
					},
				},
			},
		},
		&corev1.Service{
			TypeMeta:   metav1.TypeMeta{APIVersion: "v1", Kind: "Service"},
			ObjectMeta: metav1.ObjectMeta{Name: gatewayName, Namespace: req.Parent.Namespace},
			Spec: corev1.ServiceSpec{
				Selector: gatewayLabels,
				Ports:    []corev1.ServicePort{{Name: "http", Port: 9000}},
			},
		},
	}

	ingress := &networkingv1.Ingress{
		TypeMeta: metav1.TypeMeta{APIVersion: "networking.k8s.io/v1", Kind: "Ingress"},
		ObjectMeta: metav1.ObjectMeta{
			Name:        req.Parent.Name,
			Namespace:   req.Parent.Namespace,
			Annotations: env.GatewayIngressAnnotations(),
		},
		Spec: networkingv1.IngressSpec{
			Rules: []networkingv1.IngressRule{{
				Host: req.GetEffectiveGatewayHost(),
				IngressRuleValue: networkingv1.IngressRuleValue{
					HTTP: &networkingv1.HTTPIngressRuleValue{
						Paths: []networkingv1.HTTPIngressPath{{
							Path:     "/",
							PathType: util.PtrTo(networkingv1.PathTypePrefix),
							Backend: networkingv1.IngressBackend{
								Service: &networkingv1.IngressServiceBackend{
									Name: gatewayName,
									Port: networkingv1.ServiceBackendPort{Number: 9000},
								},
							},
						}},
					},
				},
			}},
		},
	}

	if ingressClass := env.GatewayIngressClass(); ingressClass != "" {
		ingress.Spec.IngressClassName = &ingressClass
	}

	result = append(result, ingress)

	return result, nil
}

func (req *request) GetGatewayConfig() (*gatewayconfig.Config, error) {
	cfg := &gatewayconfig.Config{
		Host: &gatewayconfig.URL{
			Scheme: env.GatewayHostScheme(),
			Host:   req.GetEffectiveGatewayHost(),
		},
		Authorization: gatewayconfig.Authorization{
			Server:                           env.OIDCUrl(),
			ServerMetadataProxyEnabled:       true,
			AuthorizationProxyEnabled:        true,
			DynamicClientRegistrationEnabled: util.PtrTo(true),
			DynamicClientRegistration: &gatewayconfig.DynamicClientRegistration{
				Enabled:      true,
				PublicClient: req.Parent.Spec.Authorization.DynamicClientRegistration.PublicClient,
			},
		},
		DexGRPCClient: &gatewayconfig.DexGRPCClient{Addr: env.DexGRPCAddr()},
	}

	for _, project := range req.Parent.Spec.Projects {
		proxy := gatewayconfig.Proxy{
			Path: fmt.Sprintf(env.GatewayPathFormat(), project.ProjectName),
			Authentication: gatewayconfig.ProxyAuthentication{
				Enabled: project.Authenticated,
			},
			Telemetry: gatewayconfig.ProxyTelemetry{
				Enabled: project.Telemetry,
			},
			Webhook: &gatewayconfig.Webhook{
				Method: http.MethodPost,
				Url: gatewayconfig.URL{
					Scheme: env.HostScheme(),
					Host:   env.Host(),
					Path:   fmt.Sprintf("/webhook/proxy/%v", project.DeploymentRevisionID),
				},
			},
		}

		if project.ProxyURL != nil {
			if proxyURL, err := url.Parse(*project.ProxyURL); err != nil {
				return nil, err
			} else {
				proxy.Http = &gatewayconfig.ProxyHttp{
					Url: (*gatewayconfig.URL)(proxyURL),
				}
			}
		}

		cfg.Proxy = append(cfg.Proxy, proxy)
	}

	return cfg, nil
}

func (req *request) GetEffectiveGatewayHost() string {
	if req.Parent.Spec.CustomDomain != nil {
		return *req.Parent.Spec.CustomDomain
	} else {
		return fmt.Sprintf(env.GatewayHostFormat(), req.Parent.Spec.OrganizationName)
	}

}

func (req *request) GetStatus() *v1alpha1.MCPGatewayStatus {
	return nil
}

type response struct {
	Status   *v1alpha1.MCPGatewayStatus `json:"status,omitempty"`
	Children []client.Object            `json:"children,omitempty"`
}
