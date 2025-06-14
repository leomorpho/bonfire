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

.PHONY: dev
dev: ## Start the dev server
	npm run dev

.PHONY: fresh
fresh: ## Clean db, seed with data, and start dev server
	rm -f local.db && pnpm run migrate && pnpm run seed && pnpm run dev

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

#####################################
# Docker testing area
#####################################
IMAGE_NAME = bonfire
CONTAINER_NAME = bonfire-container
PORT = 3000
ENV_FILE = .env.prod

# Build the Docker image
builddocker:
	docker build --tag $(IMAGE_NAME) . --no-cache

# Run the container locally
run:
	docker rm -f bonfire-container && docker run --env-file $(ENV_FILE) -p $(PORT):$(PORT) --name $(CONTAINER_NAME) $(IMAGE_NAME)

runi:
	docker rm -f bonfire-container && docker run -it --env-file $(ENV_FILE) -p $(PORT):$(PORT) --name $(CONTAINER_NAME) $(IMAGE_NAME) sh

# Stop the running container
runstop:
	docker stop $(CONTAINER_NAME) || true

# Rebuild the app and restart the container
rebuild: stop build run

# Shell into the running container
shell:
	docker exec -it $(CONTAINER_NAME) /bin/sh

# Clean up unused images and containers
cleandocker:
	docker system prune -f

localbuild:
	npm run build && npm run preview 

######################################
# Playwright
######################################

# To run for mobile: `make codegen mobile=true`
.PHONY: codegen
codegen: ## Generate Playwright tests interactively
ifeq ($(mobile),true)
	@echo "Running Playwright codegen for mobile on predefined device (iPhone 12) at URL http://localhost:8002..."
	@cd e2e && npx playwright codegen --device="iPhone 12" http://localhost:5173
else
	@echo "Running Playwright codegen for desktop at URL http://localhost:5173..."
	@cd e2e && npx playwright codegen http://localhost:5173
endif

.PHONY: e2e
e2e: ## Run Playwright tests
	@echo "Running end-to-end tests..."
	@npx playwright test

.PHONY: e2eui
e2eui: ## Run Playwright tests
	@echo "Running end-to-end tests..."
	@npx playwright test --ui

stripe-webhook: ## Forward events from test mode to local webhooks endpoint 
	stripe listen --forward-to localhost:5173/stripe/webhook --latest