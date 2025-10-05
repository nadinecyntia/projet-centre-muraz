-- Performance indexes for analyses and indices pages
-- Safe to run multiple times (IF NOT EXISTS)

-- Eggs (current)
CREATE INDEX IF NOT EXISTS idx_eggs_new_status_date
  ON eggs_collection_new (status, eggs_visit_start_date);
CREATE INDEX IF NOT EXISTS idx_eggs_new_sector
  ON eggs_collection_new (eggs_sector);

-- Eggs (archive)
CREATE INDEX IF NOT EXISTS idx_eggs_archive_year_status_date
  ON eggs_collection_archive (archived_year, status, eggs_visit_start_date);
CREATE INDEX IF NOT EXISTS idx_eggs_archive_sector
  ON eggs_collection_archive (eggs_sector);

-- Breeding sites (current)
CREATE INDEX IF NOT EXISTS idx_breeding_new_status_date
  ON breeding_sites_new (status, site_visit_start_date);
CREATE INDEX IF NOT EXISTS idx_breeding_new_sector
  ON breeding_sites_new (site_sector);
CREATE INDEX IF NOT EXISTS idx_breeding_new_environment
  ON breeding_sites_new (site_environment);

-- Breeding sites (archive)
CREATE INDEX IF NOT EXISTS idx_breeding_archive_year_status_date
  ON breeding_sites_archive (archived_year, status, site_visit_start_date);
CREATE INDEX IF NOT EXISTS idx_breeding_archive_sector
  ON breeding_sites_archive (site_sector);
CREATE INDEX IF NOT EXISTS idx_breeding_archive_environment
  ON breeding_sites_archive (site_environment);

-- Adult mosquitoes (current)
CREATE INDEX IF NOT EXISTS idx_adults_new_status_date
  ON adult_mosquitoes_new (status, mosquitoes_visit_start_date);
CREATE INDEX IF NOT EXISTS idx_adults_new_sector
  ON adult_mosquitoes_new (mosquitoes_sector);
CREATE INDEX IF NOT EXISTS idx_adults_new_environment
  ON adult_mosquitoes_new (mosquitoes_environment);

-- Adult mosquitoes (archive)
CREATE INDEX IF NOT EXISTS idx_adults_archive_year_status_date
  ON adult_mosquitoes_archive (archived_year, status, mosquitoes_visit_start_date);
CREATE INDEX IF NOT EXISTS idx_adults_archive_sector
  ON adult_mosquitoes_archive (mosquitoes_sector);
CREATE INDEX IF NOT EXISTS idx_adults_archive_environment
  ON adult_mosquitoes_archive (mosquitoes_environment);


