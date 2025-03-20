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
    PACKAGE="../../../library-galaxy-map/outoforbitdev-galaxy-map-$VERSION.tgz"
    cd ../app-galaxy-map/src/client && npm install $PACKAGE && just restart-node
    rm $PACKAGE

link:
    cd ../app-galaxy-map/src/client && npm link ../../../library-galaxy-map/ --save

clean:
    cd ../app-galaxy-map/src/client && npm unlink --no-save @outoforbitdev/galaxy-map
    npm rm --global @outoforbitdev/galaxy-map
