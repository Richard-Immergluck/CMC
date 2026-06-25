-- Support users can view operational/admin-support surfaces without receiving
-- full admin mutation authority.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUPPORT';
