FROM ubuntu:latest
LABEL authors="bitstone"

ENTRYPOINT ["top", "-b"]