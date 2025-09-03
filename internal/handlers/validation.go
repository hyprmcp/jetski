package handlers

import (
	"errors"
	"net/http"
	"regexp"
	"strings"
)

type validationFunc func() error

func validate(w http.ResponseWriter, fns ...validationFunc) bool {
	for _, fn := range fns {
		if err := fn(); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return false
		}
	}
	return true
}

func validateName(name string) validationFunc {
	return func() error {
		if strings.TrimSpace(name) == "" {
			return errors.New("empty name is not allowed")
		}

		if matched, _ := regexp.MatchString("^[a-z0-9]+(-[a-z0-9]+)*$", name); !matched {
			return errors.New("name is invalid")
		}

		return nil
	}
}

func validateDomainName(domain string) validationFunc {
	return func() error {
		if matched, _ := regexp.MatchString(`^([a-z0-9]+\.)+[a-z0-9]+$`, domain); !matched {
			return errors.New("domain is invalid")
		}

		return nil
	}
}
