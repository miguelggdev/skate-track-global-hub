# Backend Python — Makefile
# En Windows usar Git Bash o WSL. En Linux/Mac funciona directamente.
# Ajustar PYTHON si el comando difiere en tu sistema.

PYTHON ?= py -3.11

.PHONY: install dev test lint worker beat flower celery-all

install:
	$(PYTHON) -m pip install -r requirements.txt

dev:
	$(PYTHON) -m uvicorn main:app --reload --port 8000 --host 0.0.0.0

test:
	$(PYTHON) -m pytest tests/ -v

lint:
	$(PYTHON) -m ruff check .

worker:
	$(PYTHON) -m celery -A tasks.schedules worker --loglevel=info --concurrency=4

beat:
	$(PYTHON) -m celery -A tasks.schedules beat --loglevel=info

flower:
	$(PYTHON) -m celery -A tasks.schedules flower --port=5555

celery-all:
	$(PYTHON) -m celery -A tasks.schedules worker --loglevel=info --beat --concurrency=4
