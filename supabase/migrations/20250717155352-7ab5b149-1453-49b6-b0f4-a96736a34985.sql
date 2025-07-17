-- Fix the role of athlete@testclub.com from admin to athlete
UPDATE profiles SET role = 'athlete' WHERE email = 'athlete@testclub.com';