package handlers

import (
	"testing"
)

func TestValidateNameE(t *testing.T) {
	expectNil := func(arg string) {
		if err := validateName(arg)(); err != nil {
			t.Errorf(`validateNameE("%v") expected nil but found error: %v`, arg, err)
		}
	}

	expectErr := func(arg string) {
		if err := validateName(arg)(); err == nil {
			t.Errorf(`validateNameE("%v") expected error but found nil`, arg)
		}
	}

	expectNil("a")
	expectNil("a-a")

	expectErr("")
	expectErr(" ")
	expectErr("A")
	expectErr("a-")
	expectErr("-a")
	expectErr("a_a")
	expectErr("a a")
}

func TestValidateDomainE(t *testing.T) {
	expectNil := func(arg string) {
		if err := validateDomainName(arg)(); err != nil {
			t.Errorf(`validateDomainE("%v") expected nil but found error: %v`, arg, err)
		}
	}

	expectErr := func(arg string) {
		if err := validateDomainName(arg)(); err == nil {
			t.Errorf(`validateDomainE("%v") expected error but found nil`, arg)
		}
	}

	expectNil("foo.bar")

	expectErr("foo")
	expectErr("foo..bar")
	expectErr("foo.bar.")
	expectErr(".foo.bar")
	expectErr("foo.Bar")
	expectErr("Foo.bar")
}
