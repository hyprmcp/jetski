package context

import (
	"context"
	"github.com/jetski-sh/jetski/internal/auth"
	"github.com/jetski-sh/jetski/internal/db/queryable"
	"github.com/jetski-sh/jetski/internal/types"

	"go.uber.org/zap"
)

type contextKey int

const (
	ctxKeyDb contextKey = iota
	ctxKeyLogger
	ctxKeyIPAddress
	ctxKeyUserAuthInfo
	ctxKeyUser
)

func GetDb(ctx context.Context) queryable.Queryable {
	val := ctx.Value(ctxKeyDb)
	if db, ok := val.(queryable.Queryable); ok {
		if db != nil {
			return db
		}
	}
	panic("db not contained in context")
}

func WithDb(ctx context.Context, db queryable.Queryable) context.Context {
	ctx = context.WithValue(ctx, ctxKeyDb, db)
	return ctx
}

func GetLogger(ctx context.Context) *zap.Logger {
	val := ctx.Value(ctxKeyLogger)
	if logger, ok := val.(*zap.Logger); ok {
		if logger != nil {
			return logger
		}
	}
	panic("logger not contained in context")
}

func WithLogger(ctx context.Context, logger *zap.Logger) context.Context {
	ctx = context.WithValue(ctx, ctxKeyLogger, logger)
	return ctx
}

func GetRequestIPAddress(ctx context.Context) string {
	if val, ok := ctx.Value(ctxKeyIPAddress).(string); ok {
		return val
	}
	panic("no IP address in context")
}

func WithRequestIPAddress(ctx context.Context, address string) context.Context {
	return context.WithValue(ctx, ctxKeyIPAddress, address)
}

func GetUserAuthInfo(ctx context.Context) *auth.UserAuthInfo {
	if val, ok := ctx.Value(ctxKeyUserAuthInfo).(*auth.UserAuthInfo); ok {
		if val != nil {
			return val
		}
	}
	panic("no user auth info in context")
}

func WithUserAuthInfo(ctx context.Context, user *auth.UserAuthInfo) context.Context {
	return context.WithValue(ctx, ctxKeyUserAuthInfo, user)
}

func GetUser(ctx context.Context) *types.UserAccount {
	if val, ok := ctx.Value(ctxKeyUser).(*types.UserAccount); ok {
		if val != nil {
			return val
		}
	}
	panic("no user in context")
}

func WithUser(ctx context.Context, user *types.UserAccount) context.Context {
	return context.WithValue(ctx, ctxKeyUser, user)
}
