# Use distroless as minimal base image to package the manager binary
# Refer to https://github.com/GoogleContainerTools/distroless for more details
FROM gcr.io/distroless/static-debian12:nonroot@sha256:627d6c5a23ad24e6bdff827f16c7b60e0289029b0c79e9f7ccd54ae3279fb45f
WORKDIR /
COPY dist/jetski /jetski
COPY dist/*.spdx.json /usr/local/share/sbom/
USER 65532:65532
ENTRYPOINT ["/jetski"]
CMD ["serve"]
