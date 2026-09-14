UPDATE `files` SET `checksum_sha256` = 'cef3ba4db5d0f1eed61be5656ad7f12f05c251c25e988634fcef99964cf97ad8' WHERE `id` = 1;
UPDATE `files` SET `checksum_sha256` = '148221b537ed6bd55b1b25d3e05d93d84cc43029211f586d437fb476e6f3fa87' WHERE `id` = 2;
UPDATE `files` SET `checksum_sha256` = '961477b7dff49b539eb9004bca834ef2b2039f24bac6e0079a44134c55f8f749' WHERE `id` = 3;
UPDATE `files` SET `checksum_sha256` = '7b68f25fe6b066ecf4ec9cbca1356fb5434a94510f32e4aa73953b3b8a581a2b' WHERE `id` = 4;
UPDATE `files` SET `checksum_sha256` = 'b26cef75b08cfa624b459b507eb1f16834e3917e8673816af278788c07d28dd4' WHERE `id` = 5;
UPDATE `file_versions` fv JOIN `files` f ON fv.file_id = f.id SET fv.checksum_sha256 = f.checksum_sha256;
