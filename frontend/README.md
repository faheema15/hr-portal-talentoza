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

how i want is in attendance from doj all days except sundays holidays should me marked green (not future dates) wverydat it should be green ubutyes hr being to click and update to mark leave or change leave to present should be possible 