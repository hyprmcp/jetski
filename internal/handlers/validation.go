package handlers

import (
	"errors"
	"net/http"
	"regexp"
	"strings"
)

func validateName(w http.ResponseWriter, name string) bool {
	if err := validateNameE(name); err != nil {
		Handle4XXErrorWithStatusText(w, http.StatusBadRequest, err.Error())
		return false
	} else {
		return true
	}
}

func validateNameE(name string) error {
	if strings.TrimSpace(name) == "" {
		return errors.New("empty name is not allowed")
	}

	if matched, _ := regexp.MatchString("^[a-z0-9]+(-[a-z0-9]+)*$", name); !matched {
		return errors.New("name is invalid")
	}

	return nil
}
