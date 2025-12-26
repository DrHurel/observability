-- Create observability database
CREATE DATABASE IF NOT EXISTS observability;

-- Create application_logs table in default database
CREATE TABLE IF NOT EXISTS default.application_logs (
    timestamp DateTime DEFAULT now(),
    level String,
    logger String,
    message String,
    thread String
) ENGINE = MergeTree()
ORDER BY timestamp;

-- Create user_events table in observability database
CREATE TABLE IF NOT EXISTS observability.user_events (
    id UInt64,
    timestamp DateTime DEFAULT now(),
    event_type String,
    user_id String,
    user_name String,
    user_email String,
    details String
) ENGINE = MergeTree()
ORDER BY timestamp;

-- Create product_events table in observability database
CREATE TABLE IF NOT EXISTS observability.product_events (
    id UInt64,
    timestamp DateTime DEFAULT now(),
    event_type String,
    product_id String,
    product_name String,
    product_price Float64,
    details String
) ENGINE = MergeTree()
ORDER BY timestamp;
