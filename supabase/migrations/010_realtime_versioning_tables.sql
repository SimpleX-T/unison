-- Enable Realtime for versioning tables so clients get instant updates
alter publication supabase_realtime add table documents;
alter publication supabase_realtime add table document_branches;
alter publication supabase_realtime add table merge_requests;
