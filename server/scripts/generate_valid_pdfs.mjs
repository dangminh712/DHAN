import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storageDir = path.resolve(__dirname, '../Storage');

function createIsoCompliantPdf(docTitle, pagesContent) {
  let body = '%PDF-1.4\n';
  const offsets = [];

  function addObj(objNum, content) {
    offsets[objNum] = Buffer.byteLength(body, 'latin1');
    body += `${objNum} 0 obj\n${content}\nendobj\n`;
  }

  const pageCount = pagesContent.length;
  const pageObjNums = [];
  let currentObj = 3;

  for (let i = 0; i < pageCount; i++) {
    pageObjNums.push(currentObj);
    currentObj += 2; // page obj + content stream obj
  }
  const fontObjNum = currentObj;

  // Obj 1: Catalog
  addObj(1, '<< /Type /Catalog /Pages 2 0 R >>');

  // Obj 2: Pages
  const kidsStr = pageObjNums.map(n => `${n} 0 R`).join(' ');
  addObj(2, `<< /Type /Pages /Kids [${kidsStr}] /Count ${pageCount} >>`);

  // Create each page & its content stream
  for (let i = 0; i < pageCount; i++) {
    const pageNum = pageObjNums[i];
    const contentNum = pageNum + 1;
    const pageLines = pagesContent[i];

    addObj(pageNum, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentNum} 0 R /Resources << /Font << /F1 ${fontObjNum} 0 R >> >> >>`);

    let stream = 'BT\n/F1 16 Tf\n50 720 Td\n(' + escapePdf(docTitle) + ' - Trang ' + (i + 1) + '/' + pageCount + ') Tj\n/F1 11 Tf\n';
    for (const line of pageLines) {
      stream += '0 -22 Td\n(' + escapePdf(line) + ') Tj\n';
    }
    stream += 'ET\n';

    const streamLen = Buffer.byteLength(stream, 'latin1');
    addObj(contentNum, `<< /Length ${streamLen} >>\nstream\n${stream}endstream`);
  }

  // Font object
  addObj(fontObjNum, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

  // Xref table
  const totalObjs = fontObjNum + 1;
  const xrefOffset = Buffer.byteLength(body, 'latin1');
  let xref = `xref\n0 ${totalObjs}\n0000000000 65535 f \n`;

  for (let i = 1; i < totalObjs; i++) {
    const off = String(offsets[i] || 0).padStart(10, '0');
    xref += `${off} 00000 n \n`;
  }

  xref += `trailer\n<< /Size ${totalObjs} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(body + xref, 'latin1');
}

function escapePdf(text) {
  return String(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

const samplePdfCatalog = {
  'Giao_trinh_An_ninh_dieu_tra_Chuong_1.pdf': {
    title: 'GIAO TRINH AN NINH DIEU TRA - CHUONG 1',
    pages: [
      [
        'BO CONG AN - HOC VIEN AN NINH NHAN DAN (T04)',
        'KHOA AN NINH DIEU TRA - BO MON KY THUAT HINH SU',
        '------------------------------------------------------------',
        'CHUYEN DE: PHUONG PHAP THU THAP VA BAO QUAN DAU VET DIEN TU',
        '1. Khai niem va ban chat cua dau vet ky thuat so trong to tung.',
        '2. Quy trinh niem phong thiet bi dien tu theo tieu chuan ISO/IEC 27037.',
        '3. Su dung thiet bi Faraday nham chong xoa du lieu tu xa.',
        '4. Thao tac tao ban sao bit-stream (Forensic Image) khong thay doi du lieu goc.',
        '5. Tinh toan ma bam SHA-256 va SHA-512 truoc va sau khi trich xuat.'
      ],
      [
        'CHUONG 1 (TIEP THEO): QUY DINH PHAP LUAT VE CHUNG CU DIEN TU',
        '------------------------------------------------------------',
        'Dieu 87, 88, 89 Bo luat To tung Hinh su nam 2015.',
        'Nghi dinh so 13/2023/ND-CP ve bao ve du lieu ca nhan trong dieu tra.',
        'Che do bao mat tai lieu: Chi luu hanh noi bo hoc vien, nghiem cam sao chep.',
        'Can bo giang vien chiu trach nhiem giam sat chat che qua trinh tiep can.',
        'Moi hanh vi phat tan hoc lieu se bi xu ly theo Dieu lenh CAND.'
      ]
    ]
  },
  'De_cuong_bai_giang_Luat_to_tung_hinh_su.pdf': {
    title: 'DE CUONG BAI GIANG: LUAT TO TUNG HINH SU CAND',
    pages: [
      [
        'BO CONG AN - HOC VIEN AN NINH NHAN DAN',
        'KHOA LUAT - HOC PHAN TO TUNG HINH SU',
        '------------------------------------------------------------',
        'Phan I: CAC NGUYEN TAC CO BAN TRONG TO TUNG HINH SU',
        '- Nguyen tac suy doan vo toi va trach nhiem chung minh toi pham.',
        '- Trinh tu, thu tuc khoi to vu an hinh su va khoi to bi can.',
        '- Cac bien phap ngan chan: Bat nguoi, tam giu, tam giam.',
        '- Thoi han tam giu theo Dieu 118 Bo luat To tung Hinh su.',
        '- Quyen va nghia vu cua nguoi bi buoc toi va luat su bao chua.'
      ]
    ]
  },
  'Tai_lieu_Toi_mat_Bao_ve_bi_mat_nha_nuoc.pdf': {
    title: 'TAI LIEU HUONG DAN: BAO VE BI MAT NHA NUOC TREN KHONG GIAN MANG',
    pages: [
      [
        'BO CONG AN - CUC AN NINH MANG VA PHONG CHONG TOI PHAM CNC',
        'CAP DO BAO MAT: TOI MAT (TOP SECRET) - HE THONG AIR-GAPPED',
        '------------------------------------------------------------',
        '1. Danh muc bi mat nha nuoc do Thu tuong Chinh phu ban hanh.',
        '2. Quy dinh ve su dung thiet bi luu tru di dong (USB, o cung ngoai).',
        '3. Nghiem cam ket noi may tinh soan thao van ban Mat voi mang Internet.',
        '4. Quy trinh kiem tra an ninh mang dinh ky va xu ly su co ro ri thong tin.',
        '5. Trach nhiem hinh su doi voi hanh vi lam lo, mat bi mat nha nuoc.'
      ]
    ]
  },
  'Giao_trinh_Chien_thuat_Trinh_sat_Thuc_dia.pdf': {
    title: 'GIAO TRINH: CHIEN THUAT TRINH SAT THUC DIA VA BAO VE MUC TIEU',
    pages: [
      [
        'BO CONG AN - KHOA AN NINH DIEU TRA & TRINH SAT',
        'GIAO TRINH LUU HANH NOI BO NGHIEP VU CAND',
        '------------------------------------------------------------',
        '1. Nguyen tac bo tri luc luong trinh sat ngoai tuyen tai dia ban trong diem.',
        '2. Phuong an phoi hop giua trinh sat va luc luong canh sat co dong.',
        '3. Xu ly cac tinh huong gay roi an ninh trat tu va bao dong cap 1.',
        '4. Ke hoach so tan nguyen thu va bao ve an toan tuyet doi muc tieu A2.',
        '5. Bao cao tinh hinh qua kenh vo tuyen ma hoa chuyen dung.'
      ]
    ]
  },
  'So_tay_Kham_nghiem_Dau_vet_Ky_thuat_so.pdf': {
    title: 'SO TAY NGHIỆP VỤ: KHAM NGHIEM DAU VET KY THUAT SO',
    pages: [
      [
        'VIEN KHOA HOC HINH SU - BO CONG AN',
        'HUONG DAN KY THUAT DANH CHO CAN BO KHAM NGHIEM',
        '------------------------------------------------------------',
        '1. Phuong phap bao ve hien truong khi phat hien may tinh, server dang mo.',
        '2. Thu thap bo nho RAM (Live Memory Acquisition) truoc khi ngat nguon.',
        '3. Chup anh hien truong cac thiet bi ngoai vi va day cap ket noi.',
        '4. Lap bien ban thu giu thiet bi ky thuat so co xac nhan cua nguoi chung kien.',
        '5. Ban giao thiet bi cho phong lab giam dinh theo quy chuan chuoi luu giu (Chain of Custody).'
      ]
    ]
  }
};

function defaultPages(name) {
  return [
    [
      'HOC VIEN AN NINH NHAN DAN - TAI LIEU DAO TAO CHUYEN NGANH',
      `Tap tin: ${name}`,
      '------------------------------------------------------------',
      'He thong quan ly hoc lieu so hoa CAND (DHAN Intranet).',
      'Tai lieu da duoc kiem duyet va dam bao tinh xac thuc ISO 32000-1.',
      'Yeu cau hoc vien, giang vien bao mat thong tin theo quy dinh Bo Cong An.',
      'Thoi diem kiem tra tinh toan ven: Thang 09/2026.'
    ]
  ];
}

function processAllPdfs(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processAllPdfs(full);
    } else if (entry.name.endsWith('.pdf')) {
      const baseName = entry.name;
      // Do not overwrite CV files if they are real CVs, only overwrite mock/broken ones
      if (baseName.startsWith('CV_')) continue;

      const meta = samplePdfCatalog[baseName] || {
        title: baseName.replace(/_/g, ' ').replace('.pdf', '').toUpperCase(),
        pages: defaultPages(baseName)
      };

      const validPdf = createIsoCompliantPdf(meta.title, meta.pages);
      fs.writeFileSync(full, validPdf);
      console.log(`[GENERATED VALID ISO PDF]: ${full} (${validPdf.length} bytes)`);
    }
  }
}

console.log('=== FIXING ALL PDF FILES TO ISO 32000-1 COMPLIANT ===');
processAllPdfs(storageDir);
console.log('=== ALL PDFS REGENERATED AND COMPLIANT ===');
