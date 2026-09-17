app_name := "library-galaxy-map"
port := "1798"
api_port := "1799"

# Bootstrap: one-time repository initialization
bootstrap:
    pre-commit install --hook-type commit-msg --hook-type pre-commit

install:
    npm install

build:
    npm run build

lint:
    docker run -v $(pwd):/app -v $(pwd)/.linters:/polylint/.linters outoforbitdev/polylint:0.1.0

lint-write:
    @echo "polylint has no autofix mode; run 'just lint' and fix findings manually."

test:
    npm test

gate: test lint

pack: build
    #!/usr/bin/env bash
    npm pack
    VERSION=$(node -p "require('./package.json').version")
    PACKAGE="../../../library-galaxy-map/outoforbitdev-galaxy-map-$VERSION.tgz"
    cd ../app-galaxy-map/src/client && npm install $PACKAGE && just restart-node
    rm $PACKAGE
