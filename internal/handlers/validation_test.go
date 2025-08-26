package handlers

import (
	"fmt"
	"testing"
)

func TestValidateNameE(t *testing.T) {
	expectNil := func(arg string) {
		if err := validateNameE(arg); err != nil {
			t.Log(fmt.Sprintf(`validateNameE("%v")`, arg), "expected nil but found error:", err)
			t.FailNow()
		}
	}

	expectErr := func(arg string) {
		if err := validateNameE(arg); err == nil {
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
