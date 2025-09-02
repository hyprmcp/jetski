package tlsask

import (
	"testing"

	"github.com/hyprmcp/jetski/internal/util"
)

func TestOrgNameGetter(t *testing.T) {
	test := func(want, have string, expect string) {
		if !util.PtrEq(getOrgName(want)(have), &expect) {
			t.Error("want", want, "have", have, "expect", expect)
		}
	}

	testNil := func(want, have string) {
		if getOrgName(want)(have) != nil {
			t.Error("want", want, "have", have, "expect", nil)
		}
	}

	testNil("", "")
	testNil("foo", "foo")
	test("%s.foo.bar", "test.foo.bar", "test")
	test("%v.foo.bar", "test.foo.bar", "test")
	test("%s.%v.foo.bar", "1.2.foo.bar", "1")
	test("test.%s.%v.foo.bar", "test.1.2.foo.bar", "1")
	testNil("test.%s.%v.foo.bar", "test1.1.2.foo.bar")
}
