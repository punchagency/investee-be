-- ============================================
-- Row Level Security Policies for TypeORM
-- ============================================
-- Run this SQL against your PostgreSQL database after TypeORM creates the tables
-- ============================================

-- Enable RLS on loan_applications
ALTER TABLE loan_applications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own applications
CREATE POLICY "Users can view own applications" ON loan_applications
    FOR SELECT
    USING (current_setting('app.user_id', true)::uuid = "userId");

-- Policy: Users can create applications (must be their own)
CREATE POLICY "Users can create applications" ON loan_applications
    FOR INSERT
    WITH CHECK (current_setting('app.user_id', true)::uuid = "userId");

-- Policy: Users can update their own applications
CREATE POLICY "Users can update own applications" ON loan_applications
    FOR UPDATE
    USING (current_setting('app.user_id', true)::uuid = "userId")
    WITH CHECK (current_setting('app.user_id', true)::uuid = "userId");

-- Policy: Allow anonymous application creation (for unauthenticated users)
CREATE POLICY "Allow anonymous application creation" ON loan_applications
    FOR INSERT
    WITH CHECK ("userId" IS NULL);

-- Policy: Admins can view all applications
CREATE POLICY "Admins can view all applications" ON loan_applications
    FOR SELECT
    USING (current_setting('app.user_role', true) = 'admin');

-- Policy: Admins can update all applications
CREATE POLICY "Admins can update all applications" ON loan_applications
    FOR UPDATE
    USING (current_setting('app.user_role', true) = 'admin');

-- ============================================
-- Enable RLS on properties
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view properties
CREATE POLICY "Anyone can view properties" ON properties
    FOR SELECT
    USING (true);

-- Policy: Admins can manage properties
CREATE POLICY "Admins can manage properties" ON properties
    FOR ALL
    USING (current_setting('app.user_role', true) = 'admin');

-- ============================================
-- Enable RLS on property_listings
ALTER TABLE property_listings ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view active listings
CREATE POLICY "Anyone can view active listings" ON property_listings
    FOR SELECT
    USING (status = 'active');

-- Policy: Users can view their own listings
CREATE POLICY "Users can view own listings" ON property_listings
    FOR SELECT
    USING (current_setting('app.user_id', true)::uuid = "sellerId");

-- Policy: Users can create their own listings
CREATE POLICY "Users can create listings" ON property_listings
    FOR INSERT
    WITH CHECK (current_setting('app.user_id', true)::uuid = "sellerId");

-- Policy: Users can update their own listings
CREATE POLICY "Users can update own listings" ON property_listings
    FOR UPDATE
    USING (current_setting('app.user_id', true)::uuid = "sellerId");

-- Policy: Admins can manage all listings
CREATE POLICY "Admins can manage all listings" ON property_listings
    FOR ALL
    USING (current_setting('app.user_role', true) = 'admin');

-- ============================================
-- Enable RLS on property_watchlist
ALTER TABLE property_watchlist ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own watchlist
CREATE POLICY "Users can view own watchlist" ON property_watchlist
    FOR SELECT
    USING (current_setting('app.user_id', true)::uuid = "userId");

-- Policy: Users can manage their own watchlist
CREATE POLICY "Users can manage own watchlist" ON property_watchlist
    FOR ALL
    USING (current_setting('app.user_id', true)::uuid = "userId");

-- ============================================
-- Enable RLS on property_offers
ALTER TABLE property_offers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view offers they made
CREATE POLICY "Users can view own offers" ON property_offers
    FOR SELECT
    USING (current_setting('app.user_id', true)::uuid = "buyerId");

-- Policy: Sellers can view offers on their listings
CREATE POLICY "Sellers can view offers on listings" ON property_offers
    FOR SELECT
    USING (
        current_setting('app.user_id', true)::uuid IN (
            SELECT "sellerId" FROM property_listings WHERE id = "listingId"
        )
    );

-- Policy: Users can create offers
CREATE POLICY "Users can create offers" ON property_offers
    FOR INSERT
    WITH CHECK (current_setting('app.user_id', true)::uuid = "buyerId");

-- Policy: Users can update their own offers
CREATE POLICY "Users can update own offers" ON property_offers
    FOR UPDATE
    USING (current_setting('app.user_id', true)::uuid = "buyerId");

-- Policy: Sellers can update offers on their listings
CREATE POLICY "Sellers can update offers on listings" ON property_offers
    FOR UPDATE
    USING (
        current_setting('app.user_id', true)::uuid IN (
            SELECT "sellerId" FROM property_listings WHERE id = "listingId"
        )
    );

-- ============================================
-- Enable RLS on property_alerts
ALTER TABLE property_alerts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own alerts
CREATE POLICY "Users can manage own alerts" ON property_alerts
    FOR ALL
    USING (current_setting('app.user_id', true)::uuid = "userId");

-- ============================================
-- Enable RLS on vendors
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view vendors
CREATE POLICY "Anyone can view vendors" ON vendors
    FOR SELECT
    USING (true);

-- Policy: Admins can manage vendors
CREATE POLICY "Admins can manage vendors" ON vendors
    FOR ALL
    USING (current_setting('app.user_role', true) = 'admin');

-- ============================================
-- Helper Indexes (if not already created by TypeORM)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_loan_applications_user_id ON loan_applications("userId");
CREATE INDEX IF NOT EXISTS idx_loan_applications_status ON loan_applications(status);
CREATE INDEX IF NOT EXISTS idx_property_listings_seller_id ON property_listings("sellerId");
CREATE INDEX IF NOT EXISTS idx_property_listings_status ON property_listings(status);
CREATE INDEX IF NOT EXISTS idx_property_watchlist_user_id ON property_watchlist("userId");
CREATE INDEX IF NOT EXISTS idx_property_offers_buyer_id ON property_offers("buyerId");
CREATE INDEX IF NOT EXISTS idx_property_offers_listing_id ON property_offers("listingId");
CREATE INDEX IF NOT EXISTS idx_property_alerts_user_id ON property_alerts("userId");
