-- Add report template configuration fields to club_settings
ALTER TABLE public.club_settings 
ADD COLUMN IF NOT EXISTS report_include_logo boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS report_include_address boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS report_include_contact boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS report_include_social boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS report_include_president boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS report_include_delegate boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS report_include_league boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS report_header_style text DEFAULT 'full' CHECK (report_header_style IN ('minimal', 'full', 'corporate'));