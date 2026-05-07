-- Run this SQL in your Supabase SQL Editor to create the diagnostic_centers table

CREATE TABLE public.diagnostic_centers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    name text,
    email text,
    phone text,
    whatsapp_number text,
    city text,
    address text,
    tests text[] DEFAULT '{"Blood Test", "Pathology", "X-Ray"}',
    avatar_url text,
    status text DEFAULT 'Pending',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.diagnostic_centers ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public profiles are viewable by everyone." 
ON public.diagnostic_centers FOR SELECT 
USING ( true );

-- Allow users to insert their own records
CREATE POLICY "Users can insert their own diagnostic center." 
ON public.diagnostic_centers FOR INSERT 
WITH CHECK ( auth.uid() = profile_id );

-- Allow users to update their own records
CREATE POLICY "Users can update own diagnostic center." 
ON public.diagnostic_centers FOR UPDATE 
USING ( auth.uid() = profile_id );
