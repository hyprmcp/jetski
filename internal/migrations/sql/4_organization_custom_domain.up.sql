ALTER TABLE Organization
  ADD COLUMN settings_custom_domain TEXT;

CREATE INDEX Organization_settings_custom_domain ON Organization (settings_custom_domain);
