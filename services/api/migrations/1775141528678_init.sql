--Up Migration

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE products(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    protein NUMERIC(5,1) NOT NULL CHECK (protein >= 0 AND protein <= 100),
    carbs NUMERIC(5,1) NOT NULL CHECK (carbs >= 0 AND carbs <= 100),
    fat NUMERIC(5,1) NOT NULL CHECK (fat >= 0 AND fat <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (protein + carbs + fat <= 103)
);

CREATE TABLE meals(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    servings INTEGER NOT NULL CHECK (servings >=1 AND servings <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE meal_products(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_id UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    grams NUMERIC(5,1) NOT NULL CHECK (grams > 0 AND grams <= 10000),
    UNIQUE (meal_id, product_id)
);

-- Down Migration

DROP TABLE IF EXISTS meal_products;
DROP TABLE IF EXISTS meals;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;