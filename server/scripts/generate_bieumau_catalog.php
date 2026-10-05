<?php
// server/scripts/generate_bieumau_catalog.php
// Trích xuất metadata đầy đủ từ các file HTML danh mục và sinh ra client/src/data/bieuMauCatalog.js

$dshsDir = dirname(__DIR__, 2) . '/client/public/bieumau/dshs';
$dshsCsDir = dirname(__DIR__, 2) . '/client/public/bieumau/dshs_cs';
$htmlDir = dirname(__DIR__, 2) . '/client/public/bieumau/html';
$pdfDir = dirname(__DIR__, 2) . '/client/public/bieumau/pdf';
$tthdDir = dirname(__DIR__, 2) . '/client/public/bieumau/tthd';

$catalog = [];
$seenCodes = [];

function findRealFile($dir, $code, $ext) {
    $variants = [
        $code . '.' . $ext,
        str_replace('-', '', $code) . '.' . $ext,
        str_replace('_', '', $code) . '.' . $ext,
        strtoupper($code) . '.' . $ext,
        strtolower($code) . '.' . $ext,
    ];
    foreach ($variants as $v) {
        if (file_exists($dir . '/' . $v)) return $v;
    }
    // So khớp linh hoạt không phân biệt hoa thường và dấu gạch nối
    $files = scandir($dir);
    $cleanTarget = strtolower(str_replace(['-', '_', ' '], '', $code)) . '.' . strtolower($ext);
    foreach ($files as $f) {
        if (str_starts_with($f, '.')) continue;
        if (strtolower(str_replace(['-', '_', ' '], '', $f)) === $cleanTarget) {
            return $f;
        }
    }
    return '';
}

// Helper trích xuất từ file DSHS
function parseDshsFile($filePath, $categoryKey, $categoryName, $branch = 'HSAN') {
    global $catalog, $seenCodes, $htmlDir, $pdfDir;
    if (!file_exists($filePath)) return;
    $content = file_get_contents($filePath);

    // Regex tìm <li><strong>... Biểu mẫu (B\w+)</strong> (...tên...)
    // và link ../Bieumau/(...).html và ../HS_VIETTAY/(...).pdf
    preg_match_all('/<li>\s*<strong>\s*\d+\.\s*(?:Biểu\s*mẫu|Mẫu)\s*([^<]+)<\/strong>\s*\(([^)]+)\)[\s\S]*?(?:href=[\'"][^\'"]*Bieumau\/([^\'"]+)[\'"])?[\s\S]*?(?:href=[\'"][^\'"]*HS_VIETTAY\/([^\'"]+)[\'"])?/ui', $content, $matches, PREG_SET_ORDER);

    foreach ($matches as $m) {
        $rawCode = trim($m[1]);
        $name = trim($m[2]);
        $htmlFile = !empty($m[3]) ? trim($m[3]) : '';
        $pdfFile = !empty($m[4]) ? trim($m[4]) : '';

        // Chuẩn hóa mã
        $code = preg_replace('/^(?:Biểu\s*mẫu|Mẫu)\s*/ui', '', $rawCode);
        $code = trim(str_replace([':', '.'], '', $code));

        if (!$htmlFile) {
            $htmlFile = findRealFile($htmlDir, $code, 'html');
        }
        if (!$pdfFile) {
            $pdfFile = findRealFile($pdfDir, $code, 'pdf');
        }

        $id = strtolower($branch . '_' . $categoryKey . '_' . preg_replace('/[^a-zA-Z0-9]/', '', $code));
        if (isset($seenCodes[$id])) continue;
        $seenCodes[$id] = true;

        $catalog[] = [
            'id' => $id,
            'code' => $code,
            'name' => $name,
            'categoryKey' => $categoryKey,
            'categoryName' => $categoryName,
            'branch' => $branch, // 'HSAN' | 'HSCS'
            'htmlPath' => $htmlFile ? "/bieumau/html/$htmlFile" : null,
            'pdfPath' => $pdfFile ? "/bieumau/pdf/$pdfFile" : null,
            'hasHtml' => !empty($htmlFile),
            'hasPdf' => !empty($pdfFile),
            'isHandwritingOnly' => empty($htmlFile) && !empty($pdfFile),
        ];
    }
}

// 1. Quét các danh mục An Ninh (HSAN)
$anCategories = [
    'DB' => ['file' => 'DB_T.html', 'name' => 'Hồ sơ Điều tra cơ bản (ĐB)'],
    'CN' => ['file' => 'CN_T.html', 'name' => 'Hồ sơ Cá nhân (CN)'],
    'VA' => ['file' => 'VA_T.html', 'name' => 'Hồ sơ Chuyên án (VA)'],
    'AK' => ['file' => 'AK_T.html', 'name' => 'Hồ sơ Vụ án hình sự (AK)'],
    'TX' => ['file' => 'TX_T.html', 'name' => 'Hồ sơ Truy xét (TX)'],
    'TT' => ['file' => 'TT_T.html', 'name' => 'Hồ sơ Truy tìm (TT)'],
    'NV' => ['file' => 'NV_T.html', 'name' => 'Hồ sơ Vấn đề nghiệp vụ (NV)'],
    'LL' => ['file' => 'LL_T.html', 'name' => 'Hồ sơ Lực lượng bí mật (LL)'],
    'HT' => ['file' => 'HT_T.html', 'name' => 'Hồ sơ Hộp thư bí mật (HT)'],
    'AT' => ['file' => 'AT_T.html', 'name' => 'Hồ sơ Nhà an toàn (AT)'],
    'XP' => ['file' => 'XP_T.html', 'name' => 'Hồ sơ Vi phạm xử phạt hành chính (XP)'],
    'KHAC' => ['file' => 'Khac_T.html', 'name' => 'Các biểu mẫu nghiệp vụ khác'],
];

foreach ($anCategories as $k => $info) {
    parseDshsFile($dshsDir . '/' . $info['file'], $k, $info['name'], 'HSAN');
}

// Quét thêm danhsach_bieumau.html để bù đắp bất kỳ mẫu nào còn thiếu
parseDshsFile($dshsDir . '/danhsach_bieumau.html', 'ALL_AN', 'Biểu mẫu Thông dụng An ninh', 'HSAN');

// 2. Quét các file HTML trong Bieumau/ nếu chưa có trong catalog
foreach (scandir($htmlDir) as $f) {
    if ($f === '.' || $f === '..' || str_starts_with($f, '._') || !preg_match('/\.(html|htm)$/i', $f)) continue;
    $baseName = pathinfo($f, PATHINFO_FILENAME);
    $found = false;
    foreach ($catalog as $c) {
        if (strcasecmp($c['code'], $baseName) === 0 || ($c['htmlPath'] && basename($c['htmlPath']) === $f)) {
            $found = true;
            break;
        }
    }
    if (!$found) {
        $pdfFile = findRealFile($pdfDir, $baseName, 'pdf');
        $catalog[] = [
            'id' => 'bieumau_' . strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $baseName)),
            'code' => $baseName,
            'name' => "Biểu mẫu $baseName",
            'categoryKey' => 'KHAC',
            'categoryName' => 'Biểu mẫu nghiệp vụ CAND',
            'branch' => 'HSAN',
            'htmlPath' => "/bieumau/html/$f",
            'pdfPath' => $pdfFile ? "/bieumau/pdf/$pdfFile" : null,
            'hasHtml' => true,
            'hasPdf' => !empty($pdfFile),
            'isHandwritingOnly' => false,
        ];
    }
}

// 3. Quét các file PDF trong HS_VIETTAY/ để bổ sung các biểu mẫu ĐẶC THÙ CHỈ CÓ BẢN VIẾT TAY
$pdfSpecialNames = [
    'BD1' => 'Bản đề xuất công tác nghiệp vụ',
    'BD1_CS' => 'Bản đề xuất áp dụng biện pháp nghiệp vụ CSND',
    'BL5a' => 'Bản tự nguyện cộng tác với cơ quan an ninh (Viết tay)',
    'BL5cA3' => 'Sơ đồ mạng lưới lực lượng bí mật (Khổ A3)',
    'B26c' => 'Biên bản lấy lời khai người làm chứng (Viết tay)',
    'B7c' => 'Biên bản khám nghiệm hiện trường (Viết tay)',
    'TK04c' => 'Phiếu thống kê tình hình tội phạm và vi phạm pháp luật',
    'TK05c' => 'Biểu tổng hợp kết quả công tác nghiệp vụ',
    'TK3cA3' => 'Bản thống kê đối tượng nghiệp vụ (Khổ A3)',
    'BTC' => 'Bản cam kết bảo mật thông tin nghiệp vụ (Viết tay)',
];

foreach (scandir($pdfDir) as $f) {
    if ($f === '.' || $f === '..' || str_starts_with($f, '._') || !preg_match('/\.pdf$/i', $f)) continue;
    $baseName = pathinfo($f, PATHINFO_FILENAME);
    $found = false;
    foreach ($catalog as &$c) {
        if (($c['pdfPath'] && basename($c['pdfPath']) === $f) ||
            strcasecmp(str_replace(['-', '_'], '', $c['code']), str_replace(['-', '_'], '', $baseName)) === 0) {
            if (!$c['pdfPath']) {
                $c['pdfPath'] = "/bieumau/pdf/$f";
                $c['hasPdf'] = true;
            }
            $found = true;
            break;
        }
    }
    unset($c);

    if (!$found) {
        $prettyName = $pdfSpecialNames[$baseName] ?? ("Biểu mẫu nghiệp vụ $baseName (Bản viết tay)");
        $catalog[] = [
            'id' => 'bieumau_pdf_' . strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $baseName)),
            'code' => $baseName,
            'name' => $prettyName,
            'categoryKey' => 'KHAC',
            'categoryName' => 'Biểu mẫu đặc thù chỉ có bản viết tay (PDF)',
            'branch' => 'HSAN',
            'htmlPath' => null,
            'pdfPath' => "/bieumau/pdf/$f",
            'hasHtml' => false,
            'hasPdf' => true,
            'isHandwritingOnly' => true,
        ];
    }
}

// Cập nhật lại thuộc tính isHandwritingOnly cho toàn bộ catalog
$catalog = array_map(function($item) {
    $item['isHandwritingOnly'] = empty($item['htmlPath']) && !empty($item['pdfPath']);
    return $item;
}, $catalog);

// 4. Quét các văn bản hướng dẫn TTHD/
$tthdList = [];
$tthdTitles = [
    'HD_3754.pdf' => 'Hướng dẫn 3754/HD-A61-A93 về lập, quản lý và sử dụng hồ sơ nghiệp vụ ANND',
    'HD_HSAN.pdf' => 'Công tác lập, đăng ký và quản lý sử dụng hồ sơ nghiệp vụ An ninh nhân dân',
    'HD_HSCS.pdf' => 'Công tác lập, đăng ký và quản lý sử dụng hồ sơ nghiệp vụ Cảnh sát nhân dân',
    'HD_LUU_TRU.pdf' => 'Công tác lưu trữ hồ sơ nghiệp vụ Công an nhân dân',
    'HD_my_nguy.pdf' => 'Công tác quản lý, khai thác và lưu trữ hồ sơ tài liệu',
    'HD_TTCCCP.pdf' => 'Công tác tàng thư căn cước can phạm và người vi phạm pháp luật',
    'HD_UDTH.pdf' => 'Ứng dụng tin học trong công tác hồ sơ nghiệp vụ CAND',
    'HD_TC.pdf' => 'Thu thập, tra cứu dấu vết vân tay trên hệ thống nhận dạng tự động',
    'HDSD.pdf' => 'Hướng dẫn sử dụng phần mềm biểu mẫu nghiệp vụ',
    'HD_CaiDat.pdf' => 'Tài liệu hướng dẫn cài đặt và cấu hình phần mềm',
    'Huongdan_BieuMau.pdf' => 'Hướng dẫn chi tiết quy cách điền biểu mẫu hồ sơ CAND',
];

foreach (scandir($tthdDir) as $f) {
    if ($f === '.' || $f === '..' || str_starts_with($f, '._') || !preg_match('/\.pdf$/i', $f)) continue;
    $title = $tthdTitles[$f] ?? ("Văn bản hướng dẫn " . pathinfo($f, PATHINFO_FILENAME));
    $tthdList[] = [
        'id' => 'tthd_' . strtolower(preg_replace('/[^a-zA-Z0-9]/', '', pathinfo($f, PATHINFO_FILENAME))),
        'code' => pathinfo($f, PATHINFO_FILENAME),
        'title' => $title,
        'fileName' => $f,
        'pdfPath' => "/bieumau/tthd/$f",
    ];
}

$outputJs = "// client/src/data/bieuMauCatalog.js\n";
$outputJs .= "// Danh mục biểu mẫu CAND được trích xuất tự động từ phần mềm nghiệp vụ\n\n";
$outputJs .= "export const BIEU_MAU_BRANCHES = [\n";
$outputJs .= "  { key: 'ALL', label: 'Tất cả biểu mẫu' },\n";
$outputJs .= "  { key: 'HSAN', label: 'Hồ sơ An ninh nhân dân (HSAN)' },\n";
$outputJs .= "  { key: 'HSCS', label: 'Hồ sơ Cảnh sát nhân dân (HSCS)' },\n";
$outputJs .= "  { key: 'TTHD', label: 'Văn bản hướng dẫn nghiệp vụ' },\n";
$outputJs .= "];\n\n";

$outputJs .= "export const BIEU_MAU_CATEGORIES = [\n";
$outputJs .= "  { key: 'ALL', label: 'Tất cả nhóm hồ sơ', branch: 'ALL' },\n";
foreach ($anCategories as $k => $info) {
    $outputJs .= "  { key: '{$k}', label: '{$info['name']}', branch: 'HSAN' },\n";
}
$outputJs .= "];\n\n";

$outputJs .= "export const TTHD_DOCUMENTS = " . json_encode($tthdList, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . ";\n\n";
$outputJs .= "export const BIEU_MAU_CATALOG = " . json_encode($catalog, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . ";\n\n";

$outputJs .= <<<'JS'
/**
 * Tìm kiếm biểu mẫu theo từ khóa, ngành và nhóm hồ sơ
 */
export function searchBieuMau(query = '', branch = 'ALL', category = 'ALL') {
  const q = query.trim().toLowerCase();

  return BIEU_MAU_CATALOG.filter(item => {
    // Lọc theo ngành
    if (branch !== 'ALL' && item.branch !== branch) return false;

    // Lọc theo danh mục
    if (category !== 'ALL' && item.categoryKey !== category) return false;

    // Lọc theo từ khóa tìm kiếm
    if (!q) return true;

    return (
      item.code.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.categoryName.toLowerCase().includes(q) ||
      item.categoryKey.toLowerCase().includes(q)
    );
  });
}
JS;

file_put_contents(dirname(__DIR__, 2) . '/client/src/data/bieuMauCatalog.js', $outputJs);
echo "Catalog generated successfully: " . count($catalog) . " forms, " . count($tthdList) . " TTHD documents.\n";
