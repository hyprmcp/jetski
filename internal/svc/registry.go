package svc

import (
	"context"
	"errors"
	"fmt"
	"github.com/jetski-sh/jetski/internal/mail"
	"github.com/lestrrat-go/jwx/v3/jwk"
	"net/http"
	"syscall"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jetski-sh/jetski/internal/buildconfig"
	"github.com/jetski-sh/jetski/internal/migrations"
	"github.com/jetski-sh/jetski/internal/routing"
	"github.com/jetski-sh/jetski/internal/server"
	"github.com/jetski-sh/jetski/internal/tracers"
	"go.uber.org/zap"
)

type Registry struct {
	dbPool           *pgxpool.Pool
	logger           *zap.Logger
	execDbMigrations bool
	tracers          *tracers.Tracers
	jwkSet           jwk.Set
	mailer           mail.Mailer
}

func NewDefault(ctx context.Context) (*Registry, error) {
	var reg Registry
	return newRegistry(ctx, &reg)
}

func New(ctx context.Context, options ...RegistryOption) (*Registry, error) {
	var reg Registry
	for _, opt := range options {
		opt(&reg)
	}
	return newRegistry(ctx, &reg)
}

func newRegistry(ctx context.Context, reg *Registry) (*Registry, error) {
	reg.logger = createLogger()

	reg.logger.Info("initializing service registry",
		zap.String("version", buildconfig.Version()),
		zap.String("commit", buildconfig.Commit()),
		zap.Bool("release", buildconfig.IsRelease()))

	if tracers, err := reg.createTracer(ctx); err != nil {
		return nil, err
	} else {
		reg.tracers = tracers
	}

	if reg.execDbMigrations {
		if err := migrations.Up(reg.logger); err != nil {
			return nil, err
		}
	}

	if db, err := reg.createDBPool(ctx); err != nil {
		return nil, err
	} else {
		reg.dbPool = db
	}

	if oidcProvider, err := reg.createJwkSet(ctx, reg.logger); err != nil {
		return nil, err
	} else {
		reg.jwkSet = oidcProvider
	}

	if mailer, err := createMailer(ctx); err != nil {
		return nil, err
	} else {
		reg.mailer = mailer
	}

	return reg, nil
}

func (r *Registry) Shutdown(ctx context.Context) error {
	r.logger.Warn("shutting down database connections")
	r.dbPool.Close()

	if err := r.tracers.Shutdown(ctx); err != nil {
		r.logger.Warn("tracer shutdown failed", zap.Error(err))
	}

	// some devices like stdout and stderr can not be synced by the OS
	if err := r.logger.Sync(); err != nil && !errors.Is(err, syscall.EINVAL) {
		return fmt.Errorf("logger sync failed: %w", err)
	}

	return nil
}

func (r *Registry) GetRouter() http.Handler {
	return routing.NewRouter(
		r.GetLogger(),
		r.GetDbPool(),
		r.GetTracers(),
		r.GetJwkSet(),
		r.GetMailer(),
	)
}

func (r *Registry) GetServer() server.Server {
	return server.NewServer(r.GetRouter(), r.logger.With(zap.String("server", "main")))
}
