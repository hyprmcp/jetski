package mailsending

import (
	"context"

	internalctx "github.com/hyprmcp/jetski/internal/context"
	"github.com/hyprmcp/jetski/internal/mail"
	"github.com/hyprmcp/jetski/internal/mailtemplates"
	"github.com/hyprmcp/jetski/internal/types"
	"go.uber.org/zap"
)

func SendUserInviteMail(
	ctx context.Context,
	userAccount types.UserAccount,
	organization types.Organization,
) error {
	mailer := internalctx.GetMailer(ctx)
	log := internalctx.GetLogger(ctx)

	email := mail.New(
		mail.To(userAccount.Email),
		// mail.From(*from),
		mail.Subject("Welcome to Jetski"),
		mail.HtmlBodyTemplate(mailtemplates.InviteUser(userAccount, organization)),
	)

	if err := mailer.Send(ctx, email); err != nil {
		log.Error(
			"could not send invite mail",
			zap.Error(err),
			zap.String("user", userAccount.Email),
		)
		return err
	} else {
		log.Info("invite mail has been sent", zap.String("user", userAccount.Email))
		return nil
	}
}
