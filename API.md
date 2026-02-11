# PENTA PLATFORM API

## Auth
POST /auth/register  
POST /auth/login  

## Players
GET    /players  
GET    /players/:id  
POST   /players        (ADMIN)
PUT    /players/:id    (ADMIN)
DELETE /players/:id    (ADMIN)

## Player Stats
PUT /players/:id/stats (ADMIN)

## Auth
- JWT Bearer Token
- Role based access (ADMIN only for mutations)

## Status
✔ Stable
✔ Ready for extension
