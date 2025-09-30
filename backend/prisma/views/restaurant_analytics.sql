-- Restaurant Analytics View for Dashboard Queries
-- This view provides aggregated data for restaurant performance analytics

CREATE OR REPLACE VIEW restaurant_analytics AS
SELECT 
    r.id,
    r.google_place_id,
    r.name,
    r.address,
    r.latitude,
    r.longitude,
    r.wallet_address,
    r.total_coins_received,
    r.created_at,
    
    -- Transaction statistics
    COUNT(t.id) as total_transactions,
    COALESCE(SUM(t.amount), 0) as total_transaction_amount,
    COALESCE(AVG(t.amount), 0) as avg_transaction_amount,
    
    -- Daily statistics (last 30 days)
    COUNT(CASE WHEN t.transaction_date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as transactions_last_30_days,
    COALESCE(SUM(CASE WHEN t.transaction_date >= CURRENT_DATE - INTERVAL '30 days' THEN t.amount END), 0) as coins_last_30_days,
    
    -- Weekly statistics (last 7 days)
    COUNT(CASE WHEN t.transaction_date >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as transactions_last_7_days,
    COALESCE(SUM(CASE WHEN t.transaction_date >= CURRENT_DATE - INTERVAL '7 days' THEN t.amount END), 0) as coins_last_7_days,
    
    -- Today's statistics
    COUNT(CASE WHEN DATE(t.transaction_date) = CURRENT_DATE THEN 1 END) as transactions_today,
    COALESCE(SUM(CASE WHEN DATE(t.transaction_date) = CURRENT_DATE THEN t.amount END), 0) as coins_today,
    
    -- Tourist origin diversity
    COUNT(DISTINCT t.user_origin_country) as unique_origin_countries,
    
    -- Most recent transaction
    MAX(t.transaction_date) as last_transaction_date,
    
    -- Performance ranking data
    RANK() OVER (ORDER BY r.total_coins_received DESC) as coins_rank,
    RANK() OVER (ORDER BY COUNT(t.id) DESC) as transaction_count_rank,
    
    -- Activity score (weighted combination of recent activity)
    (
        COUNT(CASE WHEN t.transaction_date >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) * 0.5 +
        COUNT(CASE WHEN t.transaction_date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) * 0.3 +
        COUNT(t.id) * 0.2
    ) as activity_score

FROM restaurants r
LEFT JOIN transactions t ON r.id = t.restaurant_id
GROUP BY 
    r.id, 
    r.google_place_id, 
    r.name, 
    r.address, 
    r.latitude, 
    r.longitude, 
    r.wallet_address, 
    r.total_coins_received, 
    r.created_at
ORDER BY r.total_coins_received DESC;