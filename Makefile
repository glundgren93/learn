.PHONY: help install build test test-watch test-learning clean dev format lint check fix

# Default target
help:
	@echo "Available targets:"
	@echo "  make install      - Install dependencies"
	@echo "  make build        - Build TypeScript project"
	@echo "  make test         - Run tests under src/"
	@echo "  make test-watch   - Run tests in watch mode"
	@echo "  make test-learning - Run tests under learning/"
	@echo "  make clean        - Remove build artifacts and node_modules"
	@echo "  make dev          - Run in development mode"
	@echo "  make format       - Format code with Prettier"
	@echo "  make lint         - Lint code with ESLint"
	@echo "  make check        - Run format check and lint"
	@echo "  make fix          - Auto-fix linting and formatting issues"

# Install dependencies
install:
	npm install

# Build TypeScript project
build:
	npm run build

# Run tests under src/
test:
	npx vitest run src/

# Run tests under learning/
test-learning:
	npx vitest run learning/

# Run tests in watch mode
test-watch:
	npm run test

# Clean build artifacts and dependencies
clean:
	rm -rf dist
	rm -rf node_modules
	rm -rf coverage
	rm -rf .turbo

# Run in development mode
dev:
	npm run dev

# Format code with Prettier
format:
	npx prettier --write "src/**/*.{ts,tsx,json,md}"
	npx prettier --write "*.{json,md}"

# Lint code with ESLint
lint:
	npx eslint "src/**/*.ts" --ext .ts

# Check formatting and linting without fixing
check:
	npx prettier --check "src/**/*.{ts,tsx,json,md}" "*.{json,md}"
	npx eslint "src/**/*.ts" --ext .ts

# Auto-fix linting and formatting issues
fix: format
	npx eslint "src/**/*.ts" --ext .ts --fix

