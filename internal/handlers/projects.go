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
	"github.com/jetski-sh/jetski/internal/analytics"
	internalctx "github.com/jetski-sh/jetski/internal/context"
	"github.com/jetski-sh/jetski/internal/db"
	"github.com/jetski-sh/jetski/internal/lists"
	"github.com/jetski-sh/jetski/internal/types"
)

func ProjectsRouter(r chi.Router) {
	r.Get("/", getProjects)
	r.Post("/", postProjectHandler())
	r.Route("/{projectId}", func(r chi.Router) {
		r.Get("/", getProjectSummary)
		r.Get("/logs", getLogsForProject)
		r.Get("/deployment-revisions", getDeploymentRevisionsForProject)
		r.Get("/analytics", getAnalytics)
		r.Put("/settings", putProjectSettings)
	})
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

func postProjectHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		user := internalctx.GetUser(ctx)

		var projectReq struct {
			Name           string    `json:"name"`
			OrganizationID uuid.UUID `json:"organizationId"`
		}

		if err := json.NewDecoder(r.Body).Decode(&projectReq); err != nil {
			Handle4XXError(w, http.StatusBadRequest)
			return
		}

		if userInOrg, _, err := db.IsUserPartOfOrg(ctx, user.ID, projectReq.OrganizationID); err != nil {
			HandleInternalServerError(w, r, err, "check user org error")
			return
		} else if !userInOrg {
			Handle4XXError(w, http.StatusBadRequest)
			return
		}

		if project, err := db.CreateProject(ctx, projectReq.OrganizationID, user.ID, projectReq.Name); err != nil {
			HandleInternalServerError(w, r, err, "create project error")
		} else {
			RespondJSON(w, project)
		}
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

	if logs, err := db.GetLogsForProject(ctx, projectID, pagination, sorting); err != nil {
		HandleInternalServerError(w, r, err, "failed to get logs for project")
	} else {
		RespondJSON(w, logs)
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

func putProjectSettings(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	user := internalctx.GetUser(ctx)
	var req struct {
		OCIURL        *string `json:"ociUrl,omitempty"`
		Port          *int    `json:"port,omitempty"`
		Authenticated bool    `json:"authenticated"`
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
		RespondJSON(w, ps)

		return nil
	})

	if err != nil {
		HandleInternalServerError(w, r, err, "failed to save settings of project")
		return
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
	var startAt *time.Time
	if startAtStr := r.URL.Query().Get("startedAt"); startAtStr != "" {
		if startAtInt, err := strconv.ParseInt(startAtStr, 10, 64); err != nil {
			Handle4XXErrorWithStatusText(w, http.StatusBadRequest, "invalid startedAt timestamp")
			return
		} else {
			t := time.Unix(startAtInt, 0)
			startAt = &t
		}
	}

	// Parse buildNumber query parameter
	var buildNumber *int
	if buildNumberStr := r.URL.Query().Get("buildNumber"); buildNumberStr != "" {
		if bn, err := strconv.Atoi(buildNumberStr); err != nil {
			Handle4XXErrorWithStatusText(w, http.StatusBadRequest, "invalid buildNumber")
			return
		} else {
			buildNumber = &bn
		}
	}

	if analyticsData, err := analytics.GetProjectAnalytics(ctx, projectID, startAt, buildNumber); err != nil {
		HandleInternalServerError(w, r, err, "failed to get analytics for project")
	} else {
		RespondJSON(w, analyticsData)
	}
}
