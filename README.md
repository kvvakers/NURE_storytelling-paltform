start - docker-compose -f docker-compose.dev.yml up -d --build
stop - docker-compose -f docker-compose.dev.yml down

db migration create - docker exec -it nure_storytelling-app-backend-1 npm run migration:create ./src/migrations/create-user-table
db migration up - docker exec -it nure_storytelling-app-backend-1 npm run migration:run
db migration down - docker exec -it nure_storytelling-app-backend-1 npm run migration:revert