-- Create athlete_gallery table
CREATE TABLE public.athlete_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT check_display_order CHECK (display_order BETWEEN 1 AND 5)
);

-- Create unique index to prevent duplicate order per athlete
CREATE UNIQUE INDEX idx_athlete_gallery_order ON public.athlete_gallery(athlete_id, display_order);

-- Enable RLS
ALTER TABLE public.athlete_gallery ENABLE ROW LEVEL SECURITY;

-- Athletes can manage their own gallery
CREATE POLICY "Athletes manage own gallery" 
ON public.athlete_gallery
FOR ALL 
USING (
  athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
)
WITH CHECK (
  athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
);

-- Staff can view all galleries
CREATE POLICY "Staff view all galleries" 
ON public.athlete_gallery
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::user_role) OR
  has_role(auth.uid(), 'coach'::user_role) OR
  has_role(auth.uid(), 'leader'::user_role)
);

-- Create storage bucket for athlete gallery images
INSERT INTO storage.buckets (id, name, public)
VALUES ('athlete-gallery', 'athlete-gallery', true);

-- Allow athletes to upload to their own folder
CREATE POLICY "Athletes upload own gallery images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'athlete-gallery' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access
CREATE POLICY "Public read athlete gallery"
ON storage.objects FOR SELECT
USING (bucket_id = 'athlete-gallery');

-- Athletes can delete their own images
CREATE POLICY "Athletes delete own gallery images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'athlete-gallery'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Athletes can update their own images
CREATE POLICY "Athletes update own gallery images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'athlete-gallery'
  AND auth.uid()::text = (storage.foldername(name))[1]
);