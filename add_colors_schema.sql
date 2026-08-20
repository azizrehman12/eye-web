-- SQL script to add available_colors to products table
-- Run this in the Supabase Dashboard -> SQL Editor

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS available_colors JSONB DEFAULT '[]'::jsonb;
