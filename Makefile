api:
	docker compose exec api bash

db:
	docker compose exec db psql -U mealbase -d mealbase