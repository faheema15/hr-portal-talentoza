cd backend
npm install
npm start

cd frontend
npm install 
npm start

Db:
local: psql -U postgres -p 5433 -d postgres -f init_local.sql
prod: psql -U postgres -p 5433 -d postgres -f init_prod.sql
default: admin@hrportal.com, admin@123 (local)

.env

todo:
temporary comment out once gcs done
google calender, gcs integration