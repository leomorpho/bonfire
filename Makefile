# Define a function to check for docker compose command
define find_docker_compose
  if command -v docker-compose >/dev/null 2>&1; then \
    echo docker-compose; \
  elif command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then \
    echo "docker compose"; \
  else \
    echo ""; \
  fi
endef

# TODO: https://github.com/casey/just?tab=readme-ov-file seems like a nice alternative/improvement to make
# Determine if you have docker-compose or docker compose installed locally
# If this does not work on your system, just set the name of the executable you have installed
DCO_BIN := $(shell $(find_docker_compose))
define Comment
	- Run `make help` to see all the available options.
endef


.PHONY: clean
clean: ## Clean db and reseed
	 rm local.db && npm run migrate && npm run seed

.PHONY: pocketbase
pocketbase: ## Start pocketbase BE
	cd pocketbase && air

.PHONY: dev
dev: ## Start the dev server
	npm run dev 

.PHONY: watch
watch: ## Start BE and FE
	overmind start

.PHONY: up
up: ## Start the Docker containers
	$(DCO_BIN) up -d --remove-orphans
	sleep 3

.PHONY: stop
stop: ## Stop the Docker containers
	$(DCO_BIN) stop

.PHONY: down
down: ## Stop the Docker containers
	$(DCO_BIN) down