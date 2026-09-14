INSERT INTO `MediaFiles` (`Id`, `OriginalFileName`, `StoredFileName`, `ContentType`, `FileSize`, `Category`, `Checksum`, `CreatedAt`) VALUES
(1, 'Giao_trinh_An_ninh_dieu_tra_Chuong_1.pdf', 'sample_giaotrinh.pdf', 'application/pdf', 712, 'document', 'a1b2c3d4e5f6789012345678901234567890abcd1234567890abcdef12345678', '2026-09-01 08:30:00'),
(2, 'Video_bai_giang_Ky_thuat_dieu_tra_co_ban.mp4', 'sample_video.mp4', 'video/mp4', 32, 'video', 'b2c3d4e5f6a1890123456789012345678901bcde2345678901cdef0123456789', '2026-09-02 10:15:00'),
(3, 'Slide_minh_hoa_Nghiep_vu_An_ninh_mang.svg', 'sample_slide.svg', 'image/svg+xml', 1504, 'image', 'c3d4e5f6a1b2901234567890123456789012cdef3456789012ef01234567890a', '2026-09-03 14:00:00'),
(4, 'De_cuong_bai_giang_Luat_to_tung_hinh_su.pdf', 'sample_de_cuong.pdf', 'application/pdf', 1063, 'document', 'd4e5f6a1b2c3012345678901234567890123def04567890123f012345678901b', '2026-09-04 09:45:00'),
(5, 'Bai_giang_Bao_ve_bi_mat_nha_nuoc_Chuong_3.pdf', 'sample_bai_giang.pdf', 'application/pdf', 1182, 'document', 'e5f6a1b2c3d4123456789012345678901234ef015678901234012345678902c', '2026-09-05 11:20:00'),
(6, 'Anh_minh_hoa_So_do_to_chuc_Khoa_ANDT.png', 'sample_photo.png', 'image/png', 68, 'image', 'f6a1b2c3d4e5234567890123456789012345f0126789012345123456789013d', '2026-09-06 16:30:00')
ON DUPLICATE KEY UPDATE `OriginalFileName`=VALUES(`OriginalFileName`);
