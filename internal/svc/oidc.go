package svc

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"

	"github.com/hyprmcp/jetski/internal/env"
	"github.com/lestrrat-go/httprc/v3"
	"github.com/lestrrat-go/jwx/v3/jwk"
	"go.uber.org/multierr"
	"go.uber.org/zap"
)

func (r *Registry) GetJwkSet() jwk.Set {
	return r.jwkSet
}

func (r *Registry) createJwkSet(ctx context.Context, logger *zap.Logger) (jwk.Set, error) {
	var keySet jwk.Set
	if cache, err := jwk.NewCache(ctx, httprc.NewClient()); err != nil {
		return nil, err
	} else if meta, err := GetMedatata(env.OIDCUrl()); err != nil {
		return nil, err
	} else if jwksURI, ok := meta["jwks_uri"].(string); !ok {
		return nil, errors.New("no jwks_uri")
	} else if err := cache.Register(ctx, jwksURI); err != nil {
		return nil, err
	} else if _, err := cache.Refresh(ctx, jwksURI); err != nil {
		return nil, err
	} else if s, err := cache.CachedSet(jwksURI); err != nil {
		return nil, err
	} else {
		keySet = s
		logger.Info("got jwk set", zap.String("jwks_uri", jwksURI))
		return keySet, nil
	}
}

const AuthorizationServerMetadataPath = "/.well-known/oauth-authorization-server"
const OIDCMetadataPath = "/.well-known/openid-configuration"

func GetMedatata(server string) (map[string]any, error) {
	uris, err := getMetadataURIs(server)
	if err != nil {
		return nil, err
	}

	getMetatadatFunc := func(u string) (map[string]any, error) {
		resp, err := http.Get(u)
		if err != nil {
			return nil, err
		}

		defer func() { _ = resp.Body.Close() }()

		if resp.StatusCode >= http.StatusBadRequest {
			return nil, fmt.Errorf("authorization server returned error: %s", resp.Status)
		}

		var metadata map[string]any
		if err := json.NewDecoder(resp.Body).Decode(&metadata); err != nil {
			return nil, err
		}

		return metadata, nil
	}

	for _, u := range uris {
		if metadata, err1 := getMetatadatFunc(u); err1 != nil {
			multierr.AppendInto(&err, err1)
		} else {
			return metadata, nil
		}
	}

	return nil, err
}

func getMetadataURIs(server string) ([]string, error) {
	var uris []string

	serverURL, err := url.Parse(server)
	if err != nil {
		return nil, fmt.Errorf("failed to parse authorization server URL: %w", err)
	}

	serverURL.Path = AuthorizationServerMetadataPath
	uris = append(uris, serverURL.String())
	serverURL.Path = OIDCMetadataPath
	uris = append(uris, serverURL.String())
	return uris, nil
}
