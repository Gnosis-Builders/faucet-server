build:
	echo ${VERSION}
	docker buildx build -t silkroad.money/faucet-server:${VERSION} . --push
forcebuild: 
	docker buildx build -t silkroad.money/faucet-server:${VERSION} . --no-cache --push
run: build
	docker-compose up
rundaemon: build
	docker-compose up -d
deployforce:forcebuild
	# VERSION=v1.0.0 make deploy
	docker push silkroad.money/faucet-server:${VERSION}
deploy:build
	# VERSION=v1.0.0 make deploy
	docker push silkroad.money/faucet-server:${VERSION}	