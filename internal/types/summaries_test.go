package types

import (
	"testing"

	"github.com/hyprmcp/jetski/internal/util"
)

func TestGetMCPURL(t *testing.T) {
	var check = func(ps ProjectSummary, expected string) {
		if actual := ps.GetMCPURL(); actual != expected {
			t.Errorf("Expected MCP URL %v, got %v", expected, actual)
		}
	}

	check(
		ProjectSummary{Organization: Organization{Name: "foo"}, Project: Project{Name: "bar"}},
		"https://foo.hyprmcp.cloud/bar/mcp",
	)

	check(
		ProjectSummary{
			Organization: Organization{Name: "foo", Settings: OrganizationSettings{CustomDomain: util.PtrTo("mcp.foo.company")}},
			Project:      Project{Name: "bar"},
		},
		"https://mcp.foo.company/bar/mcp",
	)
}
