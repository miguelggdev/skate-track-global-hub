-- Create notifications table for user-specific notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'general',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  related_entity_id UUID,
  related_entity_type TEXT
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = recipient_id);

CREATE POLICY "Coaches and admins can send notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'coach', 'leader')
  )
);

CREATE POLICY "Coaches and admins can view sent notifications" 
ON public.notifications 
FOR SELECT 
USING (
  auth.uid() = sender_id AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'coach', 'leader')
  )
);

-- Create function to update timestamps
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_notifications_recipient_id ON public.notifications(recipient_id);
CREATE INDEX idx_notifications_sender_id ON public.notifications(sender_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);

-- Create a function to send notifications to all athletes
CREATE OR REPLACE FUNCTION public.send_notification_to_athletes(
  sender_id_param UUID,
  title_param TEXT,
  message_param TEXT,
  notification_type_param TEXT DEFAULT 'general',
  related_entity_id_param UUID DEFAULT NULL,
  related_entity_type_param TEXT DEFAULT NULL
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_count INTEGER := 0;
  athlete_id UUID;
BEGIN
  -- Check if sender has permission to send notifications
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = sender_id_param 
    AND role IN ('admin', 'coach', 'leader')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only coaches, admins and leaders can send notifications';
  END IF;

  -- Insert notification for each athlete
  FOR athlete_id IN 
    SELECT a.user_id 
    FROM athletes a 
    WHERE a.user_id IS NOT NULL
      AND a.status = 'active'
  LOOP
    INSERT INTO public.notifications (
      sender_id,
      recipient_id,
      title,
      message,
      notification_type,
      related_entity_id,
      related_entity_type
    ) VALUES (
      sender_id_param,
      athlete_id,
      title_param,
      message_param,
      notification_type_param,
      related_entity_id_param,
      related_entity_type_param
    );
    
    notification_count := notification_count + 1;
  END LOOP;

  RETURN notification_count;
END;
$$;