package context

import (
	"context"

	"github.com/hyprmcp/jetski/internal/db/queryable"
	"github.com/hyprmcp/jetski/internal/mail"
	"github.com/hyprmcp/jetski/internal/types"
	"github.com/lestrrat-go/jwx/v3/jwt"

	"go.uber.org/zap"
)

type contextKey int

const (
	ctxKeyDb contextKey = iota
	ctxKeyLogger
	ctxKeyIPAddress
	ctxKeyAccessToken
	ctxKeyUser
	ctxKeyMailer
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

func GetAccessToken(ctx context.Context) jwt.Token {
	if val, ok := ctx.Value(ctxKeyAccessToken).(jwt.Token); ok {
		if val != nil {
			return val
		}
	}
	panic("no token in context")
}

func WithAccessToken(ctx context.Context, token jwt.Token) context.Context {
	return context.WithValue(ctx, ctxKeyAccessToken, token)
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

func GetMailer(ctx context.Context) mail.Mailer {
	if mailer, ok := ctx.Value(ctxKeyMailer).(mail.Mailer); ok {
		if mailer != nil {
			return mailer
		}
	}
	panic("mailer not contained in context")
}

func WithMailer(ctx context.Context, mailer mail.Mailer) context.Context {
	return context.WithValue(ctx, ctxKeyMailer, mailer)
}
