package controller

import (
	"context"
	"errors"
	"io"
	"path"

	metactrl "metacontroller/pkg/apis/metacontroller/v1alpha1"

	"github.com/hyprmcp/jetski/internal/env"
	"github.com/hyprmcp/jetski/internal/kubernetes/api/v1alpha1"
	ctrlfs "github.com/hyprmcp/jetski/internal/kubernetes/fs"
	"github.com/hyprmcp/jetski/internal/util"
	"go.uber.org/zap"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/util/yaml"
	ctrlclient "sigs.k8s.io/controller-runtime/pkg/client"
)

func Install(ctx context.Context, logger *zap.Logger, client ctrlclient.Client) error {
	if objs, err := DecodeResourceYamlDir(); err != nil {
		return err
	} else {
		objs = append(objs, ControllerConfig())
		for _, obj := range objs {
			logger.Info("applying resource",
				zap.String("kind", obj.GetObjectKind().GroupVersionKind().Kind),
				zap.String("name", obj.GetName()))

			// TODO: Use client.Apply instead but the metacontroller API objects don't provide
			// first-party apply configuration yet.
			if err := client.Patch(
				ctx,
				obj,
				ctrlclient.Apply, //nolint:staticcheck
				&ctrlclient.PatchOptions{Force: util.PtrTo(true), FieldManager: "jetski"},
			); err != nil {
				return err
			}
		}
	}

	return nil
}

func ControllerConfig() *metactrl.CompositeController {
	return &metactrl.CompositeController{
		TypeMeta: metav1.TypeMeta{
			APIVersion: "metacontroller.k8s.io/v1alpha1",
			Kind:       "CompositeController",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name: "mcpgateway-controller",
		},
		Spec: metactrl.CompositeControllerSpec{
			GenerateSelector: util.PtrTo(true),
			ParentResource: metactrl.CompositeControllerParentResourceRule{
				ResourceRule: metactrl.ResourceRule{APIVersion: v1alpha1.GroupVersion.String(), Resource: "mcpgateways"},
			},
			ChildResources: []metactrl.CompositeControllerChildResourceRule{
				{
					ResourceRule:   metactrl.ResourceRule{APIVersion: "v1", Resource: "configmaps"},
					UpdateStrategy: &metactrl.CompositeControllerChildUpdateStrategy{Method: metactrl.ChildUpdateInPlace},
				},
				{
					ResourceRule:   metactrl.ResourceRule{APIVersion: "apps/v1", Resource: "deployments"},
					UpdateStrategy: &metactrl.CompositeControllerChildUpdateStrategy{Method: metactrl.ChildUpdateInPlace},
				},
				{
					ResourceRule:   metactrl.ResourceRule{APIVersion: "v1", Resource: "services"},
					UpdateStrategy: &metactrl.CompositeControllerChildUpdateStrategy{Method: metactrl.ChildUpdateInPlace},
				},
				{
					ResourceRule:   metactrl.ResourceRule{APIVersion: "networking.k8s.io/v1", Resource: "ingresses"},
					UpdateStrategy: &metactrl.CompositeControllerChildUpdateStrategy{Method: metactrl.ChildUpdateInPlace},
				},
			},
			Hooks: &metactrl.CompositeControllerHooks{
				Sync: &metactrl.Hook{
					Webhook: &metactrl.Webhook{URL: util.PtrTo(env.GatewayWebhookURL())},
				},
			},
		},
	}
}

func DecodeResourceYamlDir() ([]ctrlclient.Object, error) {
	entries, err := ctrlfs.FS.ReadDir("embedded")

	if err != nil {
		return nil, err
	}

	var aggObjs []ctrlclient.Object

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		if f, err := ctrlfs.FS.Open(path.Join("embedded", entry.Name())); err != nil {
			return nil, err
		} else {
			defer func() { _ = f.Close() }()
			if objs, err := DecodeResourceYaml(f); err != nil {
				return nil, err
			} else {
				aggObjs = append(aggObjs, objs...)
			}
		}
	}

	return aggObjs, nil
}

func DecodeResourceYaml(data io.Reader) ([]ctrlclient.Object, error) {
	decoder := yaml.NewYAMLOrJSONDecoder(data, 4096)
	var result []ctrlclient.Object
	for {
		var obj unstructured.Unstructured
		if err := decoder.Decode(&obj); err != nil {
			if errors.Is(err, io.EOF) {
				break
			}
			return nil, err
		} else if len(obj.Object) > 0 {
			result = append(result, &obj)
		}
	}
	return result, nil
}
