<?php
// server/scripts/sync_bieumau_assets.php
// Kịch bản sao chép, làm sạch và chuẩn hóa tài nguyên Biểu mẫu CAND từ Desktop vào dự án DHAN

$sourceDir = 'C:\\Users\\DangMinh\\Desktop\\thư mục không có tiêu đề\\BieuMauHSNV';
$clientPublicDir = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'client' . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . 'bieumau';
$serverStorageDir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'Storage' . DIRECTORY_SEPARATOR . 'bieumau';

if (!is_dir($sourceDir)) {
    echo "Lỗi: Không tìm thấy thư mục nguồn: $sourceDir\n";
    exit(1);
}

echo "=== ĐỒNG BỘ TÀI NGUYÊN BIỂU MẪU CAND ===\n";
echo "Nguồn: $sourceDir\n";
echo "Đích client: $clientPublicDir\n";
echo "Đích server: $serverStorageDir\n\n";

// Tạo các thư mục đích cần thiết
$subdirs = ['html', 'pdf', 'tthd', 'style', 'image', 'dshs', 'dshs_cs'];
foreach ($subdirs as $sub) {
    @mkdir($clientPublicDir . DIRECTORY_SEPARATOR . $sub, 0777, true);
    @mkdir($serverStorageDir . DIRECTORY_SEPARATOR . $sub, 0777, true);
}

// 1. Sao chép và chuẩn hóa thư mục Style
$styleSource = $sourceDir . DIRECTORY_SEPARATOR . 'Style';
if (is_dir($styleSource)) {
    foreach (scandir($styleSource) as $file) {
        if ($file === '.' || $file === '..' || str_starts_with($file, '._') || $file === '.DS_Store') continue;
        $src = $styleSource . DIRECTORY_SEPARATOR . $file;
        $dstClient = $clientPublicDir . DIRECTORY_SEPARATOR . 'style' . DIRECTORY_SEPARATOR . $file;
        $dstServer = $serverStorageDir . DIRECTORY_SEPARATOR . 'style' . DIRECTORY_SEPARATOR . $file;
        copy($src, $dstClient);
        copy($src, $dstServer);
        echo "Copied Style: $file\n";
    }
}

// 2. Sao chép và chuẩn hóa thư mục Image
$imageSource = $sourceDir . DIRECTORY_SEPARATOR . 'Image';
if (is_dir($imageSource)) {
    foreach (scandir($imageSource) as $file) {
        if ($file === '.' || $file === '..' || str_starts_with($file, '._') || $file === '.DS_Store') continue;
        $src = $imageSource . DIRECTORY_SEPARATOR . $file;
        $dstClient = $clientPublicDir . DIRECTORY_SEPARATOR . 'image' . DIRECTORY_SEPARATOR . $file;
        $dstServer = $serverStorageDir . DIRECTORY_SEPARATOR . 'image' . DIRECTORY_SEPARATOR . $file;
        copy($src, $dstClient);
        copy($src, $dstServer);
        echo "Copied Image: $file\n";
    }
}

// 3. Sao chép và chuẩn hóa biểu mẫu đánh máy HTML (Bieumau/)
$bieumauSource = $sourceDir . DIRECTORY_SEPARATOR . 'Bieumau';
$htmlCount = 0;
if (is_dir($bieumauSource)) {
    foreach (scandir($bieumauSource) as $file) {
        if ($file === '.' || $file === '..' || str_starts_with($file, '._') || $file === '.DS_Store') continue;
        if (!preg_match('/\.(html|htm)$/i', $file)) continue;

        $src = $bieumauSource . DIRECTORY_SEPARATOR . $file;
        $content = file_get_contents($src);

        // Chuẩn hóa các đường dẫn tĩnh cũ thành đường dẫn tương đối web
        $content = preg_replace('/href=[\'"](?:C:\/?\/?BieuMauHSNV\/|\.\.\/)?Style\/([^\'"]+)[\'"]/i', 'href="/bieumau/style/$1"', $content);
        $content = preg_replace('/src=[\'"](?:C:\/?\/?BieuMauHSNV\/|\.\.\/)?Image\/([^\'"]+)[\'"]/i', 'src="/bieumau/image/$1"', $content);
        $content = preg_replace('/src=[\'"](?:C:\/?\/?BieuMauHSNV\/|\.\.\/)?js\/([^\'"]+)[\'"]/i', 'src="/bieumau/style/$1"', $content);

        // Chuẩn hóa charset UTF-8 nếu thiếu
        if (!stripos($content, 'charset=utf-8') && !stripos($content, 'charset="utf-8"')) {
            $content = str_replace('<head>', "<head>\n\t<meta charset=\"utf-8\">", $content);
        }

        $dstClient = $clientPublicDir . DIRECTORY_SEPARATOR . 'html' . DIRECTORY_SEPARATOR . $file;
        $dstServer = $serverStorageDir . DIRECTORY_SEPARATOR . 'html' . DIRECTORY_SEPARATOR . $file;
        file_put_contents($dstClient, $content);
        file_put_contents($dstServer, $content);
        $htmlCount++;
    }
}
echo "Đã xử lý & chuẩn hóa $htmlCount biểu mẫu HTML trong Bieumau/ -> /bieumau/html/\n";

// 4. Sao chép biểu mẫu viết tay PDF (HS_VIETTAY/)
$viettaySource = $sourceDir . DIRECTORY_SEPARATOR . 'HS_VIETTAY';
$pdfCount = 0;
if (is_dir($viettaySource)) {
    foreach (scandir($viettaySource) as $file) {
        if ($file === '.' || $file === '..' || str_starts_with($file, '._') || $file === '.DS_Store') continue;
        if (!preg_match('/\.pdf$/i', $file)) continue;

        $src = $viettaySource . DIRECTORY_SEPARATOR . $file;
        $dstClient = $clientPublicDir . DIRECTORY_SEPARATOR . 'pdf' . DIRECTORY_SEPARATOR . $file;
        $dstServer = $serverStorageDir . DIRECTORY_SEPARATOR . 'pdf' . DIRECTORY_SEPARATOR . $file;
        copy($src, $dstClient);
        copy($src, $dstServer);
        $pdfCount++;
    }
}
echo "Đã sao chép $pdfCount file PDF mẫu viết tay trong HS_VIETTAY/ -> /bieumau/pdf/\n";

// 5. Sao chép văn bản hướng dẫn & thông tư PDF (TTHD/)
$tthdSource = $sourceDir . DIRECTORY_SEPARATOR . 'TTHD';
$tthdCount = 0;
if (is_dir($tthdSource)) {
    foreach (scandir($tthdSource) as $file) {
        if ($file === '.' || $file === '..' || str_starts_with($file, '._') || $file === '.DS_Store') continue;
        if (!preg_match('/\.pdf$/i', $file)) continue;

        $src = $tthdSource . DIRECTORY_SEPARATOR . $file;
        $dstClient = $clientPublicDir . DIRECTORY_SEPARATOR . 'tthd' . DIRECTORY_SEPARATOR . $file;
        $dstServer = $serverStorageDir . DIRECTORY_SEPARATOR . 'tthd' . DIRECTORY_SEPARATOR . $file;
        copy($src, $dstClient);
        copy($src, $dstServer);
        $tthdCount++;
    }
}
echo "Đã sao chép $tthdCount file PDF hướng dẫn trong TTHD/ -> /bieumau/tthd/\n";

// 6. Sao chép danh mục mẫu An ninh (DSHS/) và Cảnh sát (DSHS_CS/)
$dshsSource = $sourceDir . DIRECTORY_SEPARATOR . 'DSHS';
if (is_dir($dshsSource)) {
    foreach (scandir($dshsSource) as $file) {
        if ($file === '.' || $file === '..' || str_starts_with($file, '._') || $file === '.DS_Store') continue;
        $src = $dshsSource . DIRECTORY_SEPARATOR . $file;
        copy($src, $clientPublicDir . DIRECTORY_SEPARATOR . 'dshs' . DIRECTORY_SEPARATOR . $file);
        copy($src, $serverStorageDir . DIRECTORY_SEPARATOR . 'dshs' . DIRECTORY_SEPARATOR . $file);
    }
}

$dshsCsSource = $sourceDir . DIRECTORY_SEPARATOR . 'DSHS_CS';
if (is_dir($dshsCsSource)) {
    foreach (scandir($dshsCsSource) as $file) {
        if ($file === '.' || $file === '..' || str_starts_with($file, '._') || $file === '.DS_Store') continue;
        $src = $dshsCsSource . DIRECTORY_SEPARATOR . $file;
        copy($src, $clientPublicDir . DIRECTORY_SEPARATOR . 'dshs_cs' . DIRECTORY_SEPARATOR . $file);
        copy($src, $serverStorageDir . DIRECTORY_SEPARATOR . 'dshs_cs' . DIRECTORY_SEPARATOR . $file);
    }
}

echo "\nHOÀN TẤT ĐỒNG BỘ: $htmlCount HTML, $pdfCount PDF viết tay, $tthdCount PDF hướng dẫn.\n";
