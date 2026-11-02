.PHONY: setup data run test evaluate check

setup:
	python -m pip install -r requirements.txt

data:
	python scripts/generate_data.py --output data/product_analytics.db --end 2026-09-01

run:
	uvicorn backend.app.main:app --reload

test:
	python -m unittest discover -s tests -v

evaluate:
	python scripts/evaluate.py

check: test evaluate
