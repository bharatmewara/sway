-- 002_fix_verification_privacy.sql
-- 1. Purge any leaked verification selfie payloads from users table
UPDATE users
SET profile_photo = NULL,
    photo_bytes = NULL,
    photo_mime = NULL
WHERE profile_photo LIKE 'data:%';

-- 2. Nullify all verification selfies and documents stored in verification_requests
-- The verification result, gender match status, and confidence score are retained for audit metadata,
-- but the biometric selfie photo is deleted to respect user privacy and prevent leakage.
UPDATE verification_requests
SET selfie_photo = NULL,
    selfie_bytes = NULL,
    selfie_mime = NULL,
    document_photo = NULL,
    document_bytes = NULL,
    document_mime = NULL;
