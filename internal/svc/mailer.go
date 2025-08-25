package svc

import (
	"context"
	"errors"

	"github.com/hyprmcp/jetski/internal/mail/smtp"
	gomail "github.com/wneessen/go-mail"

	"github.com/hyprmcp/jetski/internal/env"
	"github.com/hyprmcp/jetski/internal/mail"
	"github.com/hyprmcp/jetski/internal/mail/noop"
	"github.com/hyprmcp/jetski/internal/mail/ses"
)

func (r *Registry) GetMailer() mail.Mailer {
	return r.mailer
}

func createMailer(ctx context.Context) (mail.Mailer, error) {
	config := env.GetMailerConfig()
	switch config.Type {
	case env.MailerTypeSMTP:
		smtpConfig := smtp.Config{
			MailerConfig: mail.MailerConfig{
				FromAddressSrc: []mail.FromAddressSrcFn{
					mail.MailOverrideFromAddress(),
					mail.StaticFromAddress(config.FromAddress.String()),
				},
			},
			Host:      config.SmtpConfig.Host,
			Port:      config.SmtpConfig.Port,
			Username:  config.SmtpConfig.Username,
			Password:  config.SmtpConfig.Password,
			TLSPolicy: gomail.TLSOpportunistic,
		}
		return smtp.New(smtpConfig)
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
