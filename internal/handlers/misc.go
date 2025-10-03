package handlers

import (
	"fmt"
	"net/http"
	"net/url"

	"github.com/go-chi/chi/v5"
	internalctx "github.com/hyprmcp/jetski/internal/context"
	"github.com/modelcontextprotocol/go-sdk/mcp"
	"go.uber.org/zap"
)

func MiscRouter() func(r chi.Router) {
	return func(r chi.Router) {
		r.Get("/verify-mcp-endpoint", verifyMcpEndpointHandler())
	}
}

func verifyMcpEndpointHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		log := internalctx.GetLogger(ctx)

		var response struct {
			Tools []string `json:"tools,omitempty"`
			Error string   `json:"error,omitempty"`
		}

		mcpURL := r.FormValue("url")
		if _, err := url.Parse(mcpURL); err != nil {
			response.Error = err.Error()
			RespondJSON(w, response)
			return
		}

		transport := &mcp.StreamableClientTransport{Endpoint: mcpURL}
		client := mcp.NewClient(&mcp.Implementation{Name: "hyprmcp-verification", Version: "1.0.0"}, nil)
		session, err := client.Connect(ctx, transport, nil)
		if err != nil {
			response.Error = fmt.Sprintf("MCP connection failed: %v", err)
			log.Info("mcp connection error", zap.Error(err))
			RespondJSON(w, response)
			return
		}

		result, err := session.ListTools(ctx, &mcp.ListToolsParams{})
		if err != nil {
			log.Info("mcp list tools error", zap.Error(err))
			response.Error = fmt.Sprintf("MCP list tools call failed: %v", err)
			RespondJSON(w, response)
			return
		}

		if err := session.Close(); err != nil {
			log.Warn("session close error", zap.Error(err))
		}

		for _, tool := range result.Tools {
			response.Tools = append(response.Tools, tool.Name)
		}

		RespondJSON(w, response)
	}
}
