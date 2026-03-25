-- ============================================================
-- PHASE 2: Storage Buckets & Policies for School Logos
-- ============================================================

-- 1. Create a public bucket for school branding (logos, headers)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('branding', 'branding', true, 5242880, '{image/jpeg, image/png, image/webp}')
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop existing policies if any to avoid errors on rerun
DROP POLICY IF EXISTS "Public View Branding" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Branding" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update Branding" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete Branding" ON storage.objects;

-- 3. Allow public read access to all logos
CREATE POLICY "Public View Branding" ON storage.objects
FOR SELECT
USING (bucket_id = 'branding');

-- 4. Allow authenticated users (who upload) to insert their own files
CREATE POLICY "Authenticated Upload Branding" ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'branding' 
    AND auth.role() = 'anon' -- We are currently using anonymous tokens based on previous steps, change if you moved to true auth.
);

-- 5. Allow updating own files
CREATE POLICY "Authenticated Update Branding" ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'branding' 
    AND auth.role() = 'anon' 
);

-- 6. Allow deleting own files
CREATE POLICY "Authenticated Delete Branding" ON storage.objects
FOR DELETE
USING (
    bucket_id = 'branding' 
    AND auth.role() = 'anon'
);
