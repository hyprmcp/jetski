package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/ecr"
	"github.com/aws/aws-sdk-go-v2/service/iam"
	"github.com/aws/aws-sdk-go-v2/service/sts"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	internalctx "github.com/jetski-sh/jetski/internal/context"
	"github.com/jetski-sh/jetski/internal/db"
	"github.com/jetski-sh/jetski/internal/lists"
	"github.com/jetski-sh/jetski/internal/util"
	"go.uber.org/multierr"
	"go.uber.org/zap"
)

func ProjectsRouter(awsConfig aws.Config) func(r chi.Router) {
	return func(r chi.Router) {
		r.Get("/", getProjects)
		r.Post("/", postProjectHandler())
		r.Route("/{projectId}", func(r chi.Router) {
			r.Get("/deployment-session", getDeploymentSessionHandler(awsConfig))
			r.Get("/logs", getLogsForProject)
			r.Get("/deployment-revisions", getDeploymentRevisionsForProject)
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

		if userInOrg, err := db.IsUserPartOfOrg(ctx, user.ID, projectReq.OrganizationID); err != nil {
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

func getLogsForProject(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	projectID := getProjectIDAndCheckAccess(w, r)
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
	projectID := getProjectIDAndCheckAccess(w, r)
	if projectID == uuid.Nil {
		return
	}
	if logs, err := db.GetDeploymentRevisionsForProject(ctx, projectID); err != nil {
		HandleInternalServerError(w, r, err, "failed to get deployment revisions for project")
	} else {
		RespondJSON(w, logs)
	}
}

func getProjectIDAndCheckAccess(w http.ResponseWriter, r *http.Request) uuid.UUID {
	ctx := r.Context()
	user := internalctx.GetUser(ctx)
	if projectIDStr := r.PathValue("projectId"); projectIDStr == "" {
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

func getDeploymentSessionHandler(awsConfig aws.Config) http.HandlerFunc {
	type DeploymentSessionResponse struct {
		RepositoryURI  string `json:"repositoryUri"`
		DockerUsername string `json:"dockerUsername"`
		DockerPassword string `json:"dockerPassword"`
		ImageTag       string `json:"imageTag"`
	}

	// Reference: https://docs.aws.amazon.com/AmazonECR/latest/userguide/image-push-iam.html
	const iamPolicyDocumentTemplate = `{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ecr:CompleteLayerUpload",
                "ecr:UploadLayerPart",
                "ecr:InitiateLayerUpload",
                "ecr:BatchCheckLayerAvailability",
                "ecr:PutImage",
                "ecr:BatchGetImage"
            ],
            "Resource": "%v"
        },
        {
            "Effect": "Allow",
            "Action": "ecr:GetAuthorizationToken",
            "Resource": "*"
        }
    ]
}`

	const iamRoleTrustPolicyTemplate = `{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "sts:AssumeRole",
            "Principal": {
                "AWS": "%v"
            },
            "Condition": {}
        }
    ]
}`

	ecrClient := ecr.NewFromConfig(awsConfig)
	iamClient := iam.NewFromConfig(awsConfig)
	stsClient := sts.NewFromConfig(awsConfig)

	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		log := internalctx.GetLogger(ctx)

		sessionID := uuid.NewString()

		log = log.With(zap.String("sessionId", sessionID))

		projectID := getProjectIDAndCheckAccess(w, r)
		if projectID == uuid.Nil {
			return
		}

		projectCfg, err := db.GetProjectRepositoryConfiguration(ctx, projectID)
		if err != nil {
			HandleInternalServerError(w, r, err, "failed to get project repository configuration")
			return
		}

		if projectCfg.AWSECRRepostoryARN == nil {
			ecrRepository, err := ecrClient.CreateRepository(ctx, &ecr.CreateRepositoryInput{
				RepositoryName: util.PtrTo("u/" + projectID.String()),
			})
			if err != nil {
				HandleInternalServerError(w, r, err, "error calling ecr.CreateRepository")
				return
			} else {
				log.Info("ECR repository created", zap.String("arn", *ecrRepository.Repository.RepositoryArn))
				projectCfg.AWSECRRepostoryARN = ecrRepository.Repository.RepositoryArn
				projectCfg.AWSECRRepostoryURI = ecrRepository.Repository.RepositoryUri
			}
		}

		if projectCfg.AWSIAMPolicyARN == nil {
			policyDoc := fmt.Sprintf(iamPolicyDocumentTemplate, *projectCfg.AWSECRRepostoryARN)
			iamPolicy, err := iamClient.CreatePolicy(ctx, &iam.CreatePolicyInput{
				PolicyName:     util.PtrTo("ecr_" + projectID.String()),
				PolicyDocument: &policyDoc,
			})
			if err != nil {
				multierr.AppendInto(&err, db.SaveProjectRepositoryConfiguration(ctx, projectCfg))
				HandleInternalServerError(w, r, err, "error calling iam.CreatePolicy")
				return
			} else {
				log.Info("IAM policy created", zap.String("arn", *iamPolicy.Policy.Arn))
				projectCfg.AWSIAMPolicyARN = iamPolicy.Policy.Arn
			}
		}

		if projectCfg.AWSIAMRoleARN == nil {
			// TODO: Use AWS account ID from config/credentials somehow
			trustPolicyDoc := fmt.Sprintf(iamRoleTrustPolicyTemplate, "324037288425")
			iamRole, err := iamClient.CreateRole(ctx, &iam.CreateRoleInput{
				RoleName:                 util.PtrTo("ecr_" + projectID.String()),
				AssumeRolePolicyDocument: util.PtrTo(trustPolicyDoc),
			})
			if err != nil {
				multierr.AppendInto(&err, db.SaveProjectRepositoryConfiguration(ctx, projectCfg))
				HandleInternalServerError(w, r, err, "error calling iam.CreateRole")
				return
			} else {
				log.Info("IAM policy created", zap.String("arn", *iamRole.Role.Arn))
				projectCfg.AWSIAMRoleARN = iamRole.Role.Arn
			}

			_, err = iamClient.AttachRolePolicy(ctx, &iam.AttachRolePolicyInput{
				PolicyArn: projectCfg.AWSIAMPolicyARN,
				RoleName:  iamRole.Role.RoleName, // Role NAME not ARN !!
			})
			if err != nil {
				multierr.AppendInto(&err, db.SaveProjectRepositoryConfiguration(ctx, projectCfg))
				HandleInternalServerError(w, r, err, "error calling iam.AttachRolePolicy")
				return
			}
			log.Info("IAM role policy attached", zap.String("roleArn", *iamRole.Role.Arn))
		}

		if err := db.SaveProjectRepositoryConfiguration(ctx, projectCfg); err != nil {
			HandleInternalServerError(w, r, err, "failed to save project repository configuration")
			return
		}

		stsAssumedRole, err := stsClient.AssumeRole(ctx, &sts.AssumeRoleInput{
			RoleArn:         projectCfg.AWSIAMRoleARN,
			RoleSessionName: &sessionID,
			DurationSeconds: util.PtrTo(int32(900)),
		})
		if err != nil {
			HandleInternalServerError(w, r, err, "error calling sts.AssumeRole")
			return
		}

		ecrAuthToken, err := ecrClient.GetAuthorizationToken(
			ctx,
			&ecr.GetAuthorizationTokenInput{},
			func(o *ecr.Options) {
				o.Credentials = credentials.NewStaticCredentialsProvider(
					*stsAssumedRole.Credentials.AccessKeyId,
					*stsAssumedRole.Credentials.SecretAccessKey,
					*stsAssumedRole.Credentials.SessionToken,
				)
			},
		)
		if err != nil {
			HandleInternalServerError(w, r, err, "error calling ecr.GetAuthorizationToken")
			return
		}

		if len(ecrAuthToken.AuthorizationData) == 0 {
			HandleInternalServerError(w, r, errors.New("ecr.GetAuthorizationToken returned empty AuthorizationData"),
				"ecr.GetAuthorizationToken returned empty AuthorizationData")
			return
		}

		RespondJSON(w, DeploymentSessionResponse{
			RepositoryURI:  *projectCfg.AWSECRRepostoryURI,
			DockerUsername: "AWS",
			DockerPassword: *ecrAuthToken.AuthorizationData[0].AuthorizationToken,
			ImageTag:       sessionID,
		})
	}
}
