package svc

import (
	"context"
	"errors"

	"github.com/jetski-sh/jetski/internal/env"
	"github.com/jetski-sh/jetski/internal/mail"
	"github.com/jetski-sh/jetski/internal/mail/noop"
	"github.com/jetski-sh/jetski/internal/mail/ses"
)

func (r *Registry) GetMailer() mail.Mailer {
	return r.mailer
}

func createMailer(ctx context.Context) (mail.Mailer, error) {
	config := env.GetMailerConfig()
	switch config.Type {
	case env.MailerTypeSES:
		sesConfig := ses.Config{
			MailerConfig: mail.MailerConfig{
				FromAddressSrc: []mail.FromAddressSrcFn{
					mail.MailOverrideFromAddress(),
					mail.StaticFromAddress(config.FromAddress.String()),
				},
			},
		}
		return ses.NewFromContext(ctx, sesConfig)
	case env.MailerTypeUnspecified:
		return noop.New(), nil
	default:
		return nil, errors.New("invalid mailer type")
	}
}
