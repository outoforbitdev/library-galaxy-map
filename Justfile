app_name := "library-galaxy-map"
port := "1798"
api_port := "1799"

install:
    npm install
    npx husky install
    npx husky init
    echo "npx commitlint --edit \$1 --config ./.linters/config/commitlint.config.js" > .husky/commit-msg
    echo "just lint" > .husky/pre-commit

build:
    npm run build

lint:
    docker run -v $(pwd):/app -v $(pwd)/.linters:/polylint/.linters outoforbitdev/polylint:0.1.0

pack: build
    #!/usr/bin/env bash
    npm pack
    VERSION=$(node -p "require('./package.json').version")
    cd ../app-galaxy-map/src/client && npm install ../../../library-galaxy-map/outoforbitdev-galaxy-map-$VERSION.tgz
