package svc

import (
	"context"
	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/jetski-sh/jetski/internal/env"
)

func (r *Registry) GetOIDCProvider() *oidc.Provider {
	return r.oidcProvider
}

func (r *Registry) createOIDCProvider(ctx context.Context) (*oidc.Provider, error) {
	return oidc.NewProvider(ctx, env.OIDCUrl())
}
