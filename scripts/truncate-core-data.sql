-- Truncate core data tables (current + archives) and reset identities
TRUNCATE TABLE
  eggs_collection_new,
  eggs_collection_archive,
  breeding_sites_new,
  breeding_sites_archive,
  adult_mosquitoes_new,
  adult_mosquitoes_archive
RESTART IDENTITY CASCADE;


