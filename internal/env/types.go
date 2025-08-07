package env

import (
	"fmt"
	"net/mail"
)

type MailerTypeString string

const (
	MailerTypeSMTP        MailerTypeString = "smtp"
	MailerTypeSES         MailerTypeString = "ses"
	MailerTypeUnspecified MailerTypeString = ""
)

func parseMailerType(value string) (MailerTypeString, error) {
	switch value {
	case string(MailerTypeSES), string(MailerTypeSMTP), string(MailerTypeUnspecified):
		return MailerTypeString(value), nil
	default:
		return "", fmt.Errorf("invalid MailerTypeString: %v", value)
	}
}

type MailerConfig struct {
	Type        MailerTypeString
	FromAddress mail.Address
	SmtpConfig  *MailerSMTPConfig
}

type MailerSMTPConfig struct {
	Host     string
	Port     int
	Username string
	Password string
}
