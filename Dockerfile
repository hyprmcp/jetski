FROM golang:1.25.3-alpine AS builder
ARG TARGETOS
ARG TARGETARCH
ARG VERSION
ARG COMMIT

WORKDIR /workspace
COPY go.mod go.mod
COPY go.sum go.sum
RUN go mod download

COPY internal/ internal/
COPY main.go main.go
RUN CGO_ENABLED=0 GOOS=${TARGETOS:-linux} GOARCH=${TARGETARCH} \
  go build -o jetski \
  -ldflags="-s -X github.com/hyprmcp/jetski/internal/buildconfig.version=${VERSION:-snapshot} -X github.com/hyprmcp/jetski/internal/buildconfig.commit=${COMMIT:-unknown}" \
  .

# Use distroless as minimal base image to package the manager binary
# Refer to https://github.com/GoogleContainerTools/distroless for more details
FROM gcr.io/distroless/static-debian12:nonroot@sha256:e8a4044e0b4ae4257efa45fc026c0bc30ad320d43bd4c1a7d5271bd241e386d0
WORKDIR /
COPY --from=builder /workspace/jetski /jetski
# FIXME: Frontend sbom
# COPY dist/*.spdx.json /usr/local/share/sbom/
USER 65532:65532
ENTRYPOINT ["/jetski"]
CMD ["serve"]
