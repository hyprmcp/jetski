package handlers

import (
	"fmt"
	"testing"
)

func TestValidateNameE(t *testing.T) {
	expectNil := func(arg string) {
		if err := validateName(arg); err != nil {
			t.Log(fmt.Sprintf(`validateNameE("%v")`, arg), "expected nil but found error:", err)
			t.FailNow()
		}
	}

	expectErr := func(arg string) {
		if err := validateName(arg); err == nil {
			t.Log(fmt.Sprintf(`validateNameE("%v")`, arg), "expected error but found nil")
			t.FailNow()
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
		if err := validateDomainName(arg); err != nil {
			t.Log(fmt.Sprintf(`validateDomainE("%v")`, arg), "expected nil but found error:", err)
			t.FailNow()
		}
	}

	expectErr := func(arg string) {
		if err := validateDomainName(arg); err == nil {
			t.Log(fmt.Sprintf(`validateDomainE("%v")`, arg), "expected error but found nil")
			t.FailNow()
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
