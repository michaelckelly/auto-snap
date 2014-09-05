JSCS = node_modules/.bin/jscs --config lib/jscs.json
SRC = $(shell find . -name '*.js' -not -path './node_modules/*')

.PHONY: setup
setup:
	npm install

.PHONY: lint
lint:
	@$(JSCS) -- $(SRC)
