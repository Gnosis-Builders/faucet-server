# Deployment Steps

1. Checkout a new branch
2. Pick a version, say `v1.0.3`
3. Update this line `image: silkroad.money/faucet-server:v1.0.2` in docker-compose.yml to reflect new version
4. Run `VERSION=v1.0.3 make deploy`
5. Update github, create a PR and get it merged to master
6. New version is deployed by circle-ci -see `.circle-ci/config.yml`