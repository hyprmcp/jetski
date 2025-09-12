# Use distroless as minimal base image to package the manager binary
# Refer to https://github.com/GoogleContainerTools/distroless for more details
FROM gcr.io/distroless/static-debian12:nonroot@sha256:e8a4044e0b4ae4257efa45fc026c0bc30ad320d43bd4c1a7d5271bd241e386d0
WORKDIR /
COPY dist/jetski /jetski
COPY dist/*.spdx.json /usr/local/share/sbom/
USER 65532:65532
ENTRYPOINT ["/jetski"]
CMD ["serve"]
