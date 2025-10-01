package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/hyprmcp/jetski/internal/analytics"
	internalctx "github.com/hyprmcp/jetski/internal/context"
	"github.com/hyprmcp/jetski/internal/db"
	"github.com/hyprmcp/jetski/internal/kubernetes/apply"
	"github.com/hyprmcp/jetski/internal/lists"
	"github.com/hyprmcp/jetski/internal/types"
	"go.uber.org/zap"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

func ProjectsRouter(k8sClient client.Client) func(r chi.Router) {
	return func(r chi.Router) {
		r.Get("/", getProjects)
		r.Post("/", postProjectHandler(k8sClient))
		r.Route("/{projectId}", func(r chi.Router) {
			r.Get("/", getProjectSummary)
			r.Get("/logs", getLogsForProject)
			r.Get("/prompts", getPromptsForProject)
			r.Get("/deployment-revisions", getDeploymentRevisionsForProject)
			r.Get("/analytics", getAnalytics)
			r.Put("/settings", putProjectSettings(k8sClient))
		})
	}
}

func getProjects(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	user := internalctx.GetUser(ctx)
	if projects, err := db.GetProjectsForUser(ctx, user.ID); err != nil {
		HandleInternalServerError(w, r, err, "failed to get projects for user")
	} else {
		RespondJSON(w, projects)
	}
}

func postProjectHandler(k8sClient client.Client) http.HandlerFunc {
	gatewayApplier := apply.MCPGateway(k8sClient)

	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		user := internalctx.GetUser(ctx)

		var projectReq struct {
			Name           string    `json:"name"`
			OrganizationID uuid.UUID `json:"organizationId"`
			ProxyURL       *string   `json:"proxyUrl"`
		}

		if err := json.NewDecoder(r.Body).Decode(&projectReq); err != nil {
			Handle4XXError(w, http.StatusBadRequest)
			return
		}

		if ok := validate(w, validateName(projectReq.Name)); !ok {
			return
		}

		userInOrg, org, err := db.IsUserPartOfOrg(ctx, user.ID, projectReq.OrganizationID)
		if err != nil {
			HandleInternalServerError(w, r, err, "check user org error")
			return
		} else if !userInOrg {
			Handle4XXError(w, http.StatusBadRequest)
			return
		}

		var project *types.Project
		err = db.RunTx(ctx, func(ctx context.Context) error {
			project, err = db.CreateProject(ctx, projectReq.OrganizationID, user.ID, projectReq.Name)
			if err != nil {
				return err
			}

			if projectReq.ProxyURL != nil {
				err := db.CreateDeploymentRevision(ctx, &types.DeploymentRevision{
					ProjectID:     project.ID,
					CreatedBy:     user.ID,
					Telemetry:     true,
					Authenticated: true,
					ProxyURL:      projectReq.ProxyURL,
				})
				if err != nil {
					return err
				}
			}
			return nil
		})

		if err != nil {
			HandleInternalServerError(w, r, err, "failed to create project")
			return
		}

		if projectReq.ProxyURL != nil {
			if err := gatewayApplier.Apply(ctx, *org); err != nil {
				internalctx.GetLogger(ctx).Error("failed to apply gateway", zap.Error(err))
			}
		}

		RespondJSON(w, project)
	}
}

func getProjectSummary(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	projectID := getProjectIDIfAllowed(w, r, pathParam)
	if projectID == uuid.Nil {
		return
	}
	if p, err := db.GetProjectSummary(ctx, projectID); err != nil {
		HandleInternalServerError(w, r, err, "failed to get project")
	} else {
		RespondJSON(w, p)
	}
}

func getLogsForProject(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	projectID := getProjectIDIfAllowed(w, r, pathParam)
	if projectID == uuid.Nil {
		return
	}
	pagination, err := lists.ParsePaginationOrDefault(r, lists.Pagination{Count: 10})
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	sorting := lists.ParseSortingOrDefault(r, lists.SortingOptions{
		DefaultSortBy:    "started_at",
		DefaultSortOrder: lists.SortOrderDesc,
		AllowedSortBy:    []string{"started_at", "duration", "http_status_code"},
	})

	var id *uuid.UUID
	if s := r.FormValue("id"); s != "" {
		if u, err := uuid.Parse(s); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		} else {
			id = &u
		}
	}

	var mcpSessionID *string
	if s := r.FormValue("mcpSessionId"); s != "" {
		mcpSessionID = &s
	}

	if logs, err := db.GetLogsForProject(ctx, projectID, pagination, sorting, id, mcpSessionID); err != nil {
		HandleInternalServerError(w, r, err, "failed to get logs for project")
	} else {
		RespondJSON(w, logs)
	}
}

func getPromptsForProject(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	projectID := getProjectIDIfAllowed(w, r, pathParam)
	if projectID == uuid.Nil {
		return
	}
	pagination, err := lists.ParsePaginationOrDefault(r, lists.Pagination{Count: 10})
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	sorting := lists.ParseSortingOrDefault(r, lists.SortingOptions{
		DefaultSortBy:    "started_at",
		DefaultSortOrder: lists.SortOrderDesc,
		AllowedSortBy:    []string{"started_at", "tool_name", "prompt"},
	})

	var mcpSessionID *string
	if s := r.FormValue("mcpSessionId"); s != "" {
		mcpSessionID = &s
	}

	if prompts, err := db.GetPromptsForProject(ctx, projectID, pagination, sorting, mcpSessionID); err != nil {
		HandleInternalServerError(w, r, err, "failed to get prompts for project")
	} else {
		RespondJSON(w, prompts)
	}
}

func getDeploymentRevisionsForProject(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	projectID := getProjectIDIfAllowed(w, r, pathParam)
	if projectID == uuid.Nil {
		return
	}
	if logs, err := db.GetDeploymentRevisionsForProject(ctx, projectID); err != nil {
		HandleInternalServerError(w, r, err, "failed to get deployment revisions for project")
	} else {
		RespondJSON(w, logs)
	}
}

func putProjectSettings(k8sClient client.Client) http.HandlerFunc {
	gatewayApplier := apply.MCPGateway(k8sClient)

	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		log := internalctx.GetLogger(ctx)
		user := internalctx.GetUser(ctx)
		var req struct {
			OCIURL        *string `json:"ociUrl,omitempty"`
			Port          *int    `json:"port,omitempty"`
			Authenticated bool    `json:"authenticated"`
			Telemetry     bool    `json:"telemetry"`
			ProxyURL      *string `json:"proxyUrl,omitempty"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			Handle4XXError(w, http.StatusBadRequest)
			return
		}

		if req.OCIURL != nil && req.ProxyURL != nil {
			Handle4XXErrorWithStatusText(w, http.StatusBadRequest, "Proxy URL not allowed if OCI URL is set")
			return
		} else if req.OCIURL != nil {
			if req.Port == nil {
				Handle4XXErrorWithStatusText(w, http.StatusBadRequest, "Port is required if OCI URL is set")
				return
			}
		} else if req.ProxyURL != nil {
			if req.Port != nil {
				Handle4XXErrorWithStatusText(w, http.StatusBadRequest, "Port is not allowed if proxy URL is set")
				return
			} else if u, err := url.Parse(*req.ProxyURL); err != nil || u.Scheme == "" || u.Host == "" {
				Handle4XXErrorWithStatusText(w, http.StatusBadRequest, "Invalid proxy URL format")
				return
			}
		}

		projectID := getProjectIDIfAllowed(w, r, pathParam)
		if projectID == uuid.Nil {
			return
		}

		err := db.RunTx(ctx, func(ctx context.Context) error {
			dr := types.DeploymentRevision{
				ProjectID:     projectID,
				CreatedBy:     user.ID,
				Authenticated: req.Authenticated,
				Telemetry:     req.Telemetry,
			}

			ps, err := db.GetProjectSummary(ctx, projectID)
			if err != nil {
				return err
			}

			if req.OCIURL != nil {
				dr.OCIURL = req.OCIURL
			} else if ps.LatestDeploymentRevision != nil {
				dr.OCIURL = ps.LatestDeploymentRevision.OCIURL
			}

			if req.Port != nil {
				dr.Port = req.Port
			} else if ps.LatestDeploymentRevision != nil {
				dr.Port = ps.LatestDeploymentRevision.Port
			}

			if req.ProxyURL != nil {
				dr.ProxyURL = req.ProxyURL
			} else if ps.LatestDeploymentRevision != nil {
				dr.ProxyURL = ps.LatestDeploymentRevision.ProxyURL
			}

			if dr.OCIURL == nil && dr.ProxyURL == nil {
				Handle4XXErrorWithStatusText(w, http.StatusBadRequest, "One of Proxy URL and OCI URL is required")
				return nil
			}

			if err := db.CreateDeploymentRevision(ctx, &dr); err != nil {
				return err
			}

			if dr.OCIURL != nil {
				if err := db.AddDeploymentRevisionEvent(ctx, dr.ID, types.DeploymentRevisionEventTypeProgressing, nil); err != nil {
					return err
				}
			}

			ps.LatestDeploymentRevisionID = &dr.ID
			ps.LatestDeploymentRevision = &dr

			if err := gatewayApplier.Apply(ctx, ps.Organization); err != nil {
				log.Error("failed to create MCPGateway resource", zap.Error(err))
			}

			RespondJSON(w, ps)

			return nil
		})

		if err != nil {
			HandleInternalServerError(w, r, err, "failed to save settings of project")
			return
		}
	}
}

func getProjectIDIfAllowed(w http.ResponseWriter, r *http.Request, getter paramGetter) uuid.UUID {
	ctx := r.Context()
	user := internalctx.GetUser(ctx)
	if projectIDStr := getter(r, "projectId"); projectIDStr == "" {
		return uuid.Nil
	} else if projectID, err := uuid.Parse(projectIDStr); err != nil {
		Handle4XXErrorWithStatusText(w, http.StatusBadRequest, "invalid projectId")
		return uuid.Nil
	} else if ok, err := db.CanUserAccessProject(ctx, user.ID, projectID); err != nil {
		HandleInternalServerError(w, r, err, "failed to check if user can access project")
		return uuid.Nil
	} else if !ok {
		Handle4XXError(w, http.StatusNotFound)
		return uuid.Nil
	} else {
		return projectID
	}
}

func getAnalytics(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	projectID := getProjectIDIfAllowed(w, r, pathParam)
	if projectID == uuid.Nil {
		return
	}

	// Parse startedAt query parameter
	var startAt time.Time
	if startAtStr := r.URL.Query().Get("startedAt"); startAtStr != "" {
		if startAtInt, err := strconv.ParseInt(startAtStr, 10, 64); err != nil {
			Handle4XXErrorWithStatusText(w, http.StatusBadRequest, "invalid startedAt timestamp")
			return
		} else {
			t := time.Unix(startAtInt, 0)
			startAt = t
		}
	}

	if analyticsData, err := analytics.GetProjectAnalytics(ctx, projectID, startAt); err != nil {
		HandleInternalServerError(w, r, err, "failed to get analytics for project")
	} else {
		RespondJSON(w, analyticsData)
	}
}
