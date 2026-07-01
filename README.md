# DailyDough.co E-Commerce Thesis Project

A modern, responsive full-stack e-commerce prototype for a Filipino local cookie startup. It includes a customer storefront, cart, checkout, order tracking, and an admin dashboard for products, orders, analytics, and business settings.

## Architecture

- Backend: dependency-free Node.js HTTP server in `server.js`.
- Database for prototype runtime: `data/db.json`, generated automatically on first start.
- Relational database design: `schema.sql` documents normalized SQL tables for `products`, `orders`, `order_items`, `admins`, and `business_settings`.
- Frontend: vanilla HTML, CSS, and JavaScript modules under `public/`.
- Uploads: images are stored as browser data URLs in the prototype database to avoid extra dependencies.

## Run Locally

```bash
npm start
```

Open: http://127.0.0.1:8000

## Admin Login

- Username: `admin`
- Password: `admin123`

## Included Features

Customer side:

- Homepage with hero, featured products, promotional banners, about preview, and calls to action
- About page
- Product catalog with category filtering
- Product details page
- Shopping cart with quantity updates and removal
- Checkout for COD or GCash
- Placeholder GCash number and QR image
- Payment proof upload for GCash
- Lalamove delivery note with manual fee computation
- Order tracking by order number
- Contact page with inquiry form

Admin side:

- Admin login
- Product add, edit, delete, and image upload
- Order search, filter, payment proof viewing, and status updates
- Analytics for total orders, sales, monthly sales, best sellers, and recent orders
- Business settings for identity, colors, contact info, policies, GCash details, and social links

## Notes for Thesis Defense

The project intentionally avoids enterprise-level complexity. It uses simple files, plain JavaScript modules, and a small server so the full request-response flow is easy to explain and maintain. The `schema.sql` file can be migrated to SQLite, MySQL, or PostgreSQL in future versions.
