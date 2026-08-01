# Backend Python — Makefile
# En Windows usar Git Bash o WSL. En Linux/Mac funciona directamente.
# Ajustar PYTHON si el comando difiere en tu sistema.

PYTHON ?= py -3.11

.PHONY: install dev test lint

install:
	$(PYTHON) -m pip install -r requirements.txt

dev:
	$(PYTHON) -m uvicorn main:app --reload --port 8000 --host 0.0.0.0

test:
	$(PYTHON) -m pytest tests/ -v

lint:
	$(PYTHON) -m ruff check .
