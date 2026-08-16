/*
# Create projects table for PhotoForge AI

1. New Tables
- `projects`
  - `id` (uuid, primary key)
  - `user_id` (uuid, owner, defaults to auth.uid())
  - `name` (text, project name)
  - `image_url` (text, thumbnail/source image data URL — stored as data URL for demo)
  - `thumbnail` (text, small preview data URL)
  - `settings` (jsonb, editor settings snapshot)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
2. Security
- Enable RLS on `projects`.
- Owner-scoped CRUD: each authenticated user can only access rows they own.
3. Notes
- Images are stored as data URLs in the `image_url` / `thumbnail` text columns for the demo (no storage bucket needed). In production these would be Supabase Storage paths.
- `settings` jsonb holds the full editor state (adjustments, filters, text layers, etc.) so projects are restorable.
*/

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Untitled Project',
  image_url text,
  thumbnail text,
  settings jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_projects" ON projects;
CREATE POLICY "select_own_projects" ON projects FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_projects" ON projects;
CREATE POLICY "insert_own_projects" ON projects FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_projects" ON projects;
CREATE POLICY "update_own_projects" ON projects FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_projects" ON projects;
CREATE POLICY "delete_own_projects" ON projects FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);
CREATE INDEX IF NOT EXISTS projects_updated_at_idx ON projects(updated_at DESC);
