package noop

import (
	"context"

	"github.com/hyprmcp/jetski/internal/mail"
)

type mailer struct{}

// Send implements mail.Mailer by doing nothing at all
func (m *mailer) Send(ctx context.Context, mail mail.Mail) error {
	return nil
}

var _ mail.Mailer = &mailer{}

func New() *mailer { return &mailer{} }
