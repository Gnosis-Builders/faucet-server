build:
	docker build . -t gnosis-builders/faucet-server
forcebuild: 
	docker build . -t gnosis-builders/faucet-server --no-cache
run: build
	docker-compose up
rundaemon: build
	docker-compose up -d
deployforce:forcebuild
	# VERSION=v1.0.0 make deploy
	docker tag gnosis-builders/faucet-server silkroad.money/faucet-server:${VERSION}
	docker push silkroad.money/faucet-server:${VERSION}
deploy:build
	# VERSION=v1.0.0 make deploy
	docker tag gnosis-builders/faucet-server silkroad.money/faucet-server:${VERSION}
	docker push silkroad.money/faucet-server:${VERSION}	