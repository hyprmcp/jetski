package svc

import (
	metactrl "metacontroller/pkg/apis/metacontroller/v1alpha1"

	"github.com/jetski-sh/jetski/internal/kubernetes/api/v1alpha1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/cli-runtime/pkg/genericclioptions"
	ctrlclient "sigs.k8s.io/controller-runtime/pkg/client"
)

func (r *Registry) GetK8SClient() ctrlclient.Client {
	return r.k8sClient
}

func createK8SClient() (ctrlclient.Client, error) {
	configFlags := genericclioptions.NewConfigFlags(true)
	scheme := runtime.NewScheme()
	if err := v1alpha1.AddToScheme(scheme); err != nil {
		return nil, err
	} else if err := metactrl.AddToScheme(scheme); err != nil {
		return nil, err
	} else if cfg, err := configFlags.ToRESTConfig(); err != nil {
		return nil, err
	} else {
		return ctrlclient.New(cfg, ctrlclient.Options{
			Scheme: scheme,
		})
	}
}
