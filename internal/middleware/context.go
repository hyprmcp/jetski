package middleware

import (
	"context"
	"github.com/jetski-sh/jetski/internal/db/queryable"

	"go.uber.org/zap"
)

type contextKey int

const (
	ctxKeyDb contextKey = iota
	ctxKeyLogger
	ctxKeyIPAddress
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

func withDb(ctx context.Context, db queryable.Queryable) context.Context {
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

func withLogger(ctx context.Context, logger *zap.Logger) context.Context {
	ctx = context.WithValue(ctx, ctxKeyLogger, logger)
	return ctx
}

func GetRequestIPAddress(ctx context.Context) string {
	if val, ok := ctx.Value(ctxKeyIPAddress).(string); ok {
		return val
	}
	panic("no IP address in context")
}

func withRequestIPAddress(ctx context.Context, address string) context.Context {
	return context.WithValue(ctx, ctxKeyIPAddress, address)
}
