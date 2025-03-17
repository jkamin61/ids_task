# Orders Fetcher API - IdoSell Task

### This project is a Node.js service that integrates with the IdoSell API to fetch and store order data into a PostgreSQL database (Supabase-hosted). Additionally, it provides REST API endpoints to manage and export these orders.

## Features

- Fetch paginated orders from IdoSell API.

- Supports fetching orders from a specific date (reducing unnecessary API calls).

- Store unique orders in PostgreSQL database.

- REST API endpoints for viewing, filtering, and exporting orders.

## Tech Stack

- Node.js (Express)

- PostgreSQL (Supabase)

- Axios

- json2csv (CSV export)

## API Endpoints

- ### [GET] `/fetch`

Fetches new orders from the IdoSell API and stores them into the database.

**Optional query parameters:**
- `fromDate=YYYY-MM-DD` — manually specify start date.

**Example:**

- GET `/fetch?fromDate=2024-03-01`

- ### [GET] `/`

Returns a paginated list of saved orders.

**Query parameters:**
- `page` (default: `1`)
- `limit` (default: `100`)

**Example:**

- GET `/?page=1&limit=50`

- ### [GET] `/csv`

Exports all orders to a CSV file.

**Optional query parameters:**
- `minWorth=100` — export orders with worth ≥ 100.
- `maxWorth=500` — export orders with worth ≤ 500.

**Example:**

- GET `/csv?minWorth=200&maxWorth=1000`

- ### [GET] `/:orderId`

Returns a single order by `order_id`.

**Example:**

- GET `/12345`

## Automatic Sync

The system fetches orders once every 24 hours via 
```bash
    setInterval(fetchOrders, 24 * 60 * 60 * 1000).
```
 
## Notes

API is connected to a Supabase PostgreSQL instance.

Fetching logic respects business requirements (date filtering).

Project follows clean coding principles and includes error handling.

Project developed for IdoSell recruitment task.

