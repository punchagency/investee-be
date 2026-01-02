-- ============================================
-- Investee Supabase Schema
-- ============================================
-- Run this in Supabase Studio > SQL Editor after setup
-- ============================================

-- Create loan_applications table (matching existing Drizzle schema + auth)
CREATE TABLE IF NOT EXISTS public.loan_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Loan Information
  loan_type TEXT NOT NULL,
  property_type TEXT NOT NULL,
  address TEXT,
  purchase_price INTEGER NOT NULL,
  estimated_value INTEGER NOT NULL,
  down_payment INTEGER NOT NULL,
  loan_amount INTEGER NOT NULL,
  credit_score TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted',

  -- Borrower Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  preferred_contact TEXT,
  preferred_call_time TEXT,
  agree_marketing TEXT,

  -- Data Storage
  documents JSONB DEFAULT '[]'::jsonb,
  documents_meta JSONB DEFAULT '[]'::jsonb,  -- For Supabase Storage file metadata
  attom_data JSONB,

  -- Timestamps
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Auth Integration
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_loan_applications_updated_at
    BEFORE UPDATE ON loan_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_loan_applications_user_id ON loan_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_loan_applications_status ON loan_applications(status);
CREATE INDEX IF NOT EXISTS idx_loan_applications_submitted_at ON loan_applications(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_loan_applications_email ON loan_applications(email);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE loan_applications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own applications
CREATE POLICY "Users can view own applications" ON loan_applications
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can create applications (must be their own)
CREATE POLICY "Users can create applications" ON loan_applications
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own applications
CREATE POLICY "Users can update own applications" ON loan_applications
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Allow anonymous application creation (for unauthenticated users)
-- This allows the calculator to work without login
CREATE POLICY "Allow anonymous application creation" ON loan_applications
    FOR INSERT
    WITH CHECK (user_id IS NULL);

-- Policy: Admins can view all applications
CREATE POLICY "Admins can view all applications" ON loan_applications
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
        )
    );

-- Policy: Admins can update all applications
CREATE POLICY "Admins can update all applications" ON loan_applications
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
        )
    );

-- Policy: Service role bypass (for server-side operations)
CREATE POLICY "Service role bypass" ON loan_applications
    FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- Enable Realtime
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE loan_applications;

-- ============================================
-- Storage Bucket for Documents
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'loan-documents',
    'loan-documents',
    false,  -- Private bucket
    52428800,  -- 50MB limit
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies

-- Users can upload to their own folder
CREATE POLICY "Users can upload own documents" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'loan-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can view their own documents
CREATE POLICY "Users can view own documents" ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'loan-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can update their own documents
CREATE POLICY "Users can update own documents" ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'loan-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can delete their own documents
CREATE POLICY "Users can delete own documents" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'loan-documents' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Admins can view all documents
CREATE POLICY "Admins can view all documents" ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'loan-documents' AND
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
        )
    );

-- ============================================
-- Helper function to create admin user
-- ============================================

-- After creating a user in Supabase Auth, run this to make them admin:
-- UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb WHERE email = 'admin@example.com';

-- ============================================
-- Done!
-- ============================================
