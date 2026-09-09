import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { User, PointTransaction } from '../types';
import { getStatusBadge } from './storage';

// Format Indonesian currency/number/date
export function formatDateIndo(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch (e) {
    return dateStr;
  }
}

// 1. Export Excel for Individual Member
export function exportMemberExcel(user: User, transactions: PointTransaction[]): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Profil & Ringkasan
  const status = getStatusBadge(user.currentPoints);
  const totalPrestasi = transactions
    .filter(t => t.type === 'prestasi')
    .reduce((acc, curr) => acc + curr.points, 0);
  const totalPelanggaran = transactions
    .filter(t => t.type === 'pelanggaran')
    .reduce((acc, curr) => acc + curr.points, 0);

  const profileData = [
    ['LAPORAN POIN KEDISIPLINAN & PRESTASI PENGURUS PRIBADI'],
    ['ORGANISASI SISWA INTRA SEKOLAH & MAJELIS PERWAKILAN KELAS'],
    ['SMAN 6 BANDUNG - PERIODE 2026/2027'],
    [''],
    ['Nama Pengurus', user.name],
    ['Nomor Induk Siswa (NIS)', user.nis],
    ['Kelas', user.classGrade],
    ['Organisasi / Lembaga', user.organization],
    ['Divisi / Sekbid', user.division],
    ['Jabatan', user.position],
    ['Status Akun', user.role === 'admin' ? 'Pengurus Inti / Admin' : 'Pengurus'],
    [''],
    ['RINGKASAN POIN'],
    ['Poin Dasar Awal', user.initialPoints],
    ['Total Poin Prestasi (+)', totalPrestasi],
    ['Total Poin Pengurangan (-)', totalPelanggaran],
    ['Poin Akumulasi Akhir', user.currentPoints],
    ['Status Kedisiplinan', status.label],
    ['Keterangan Status', status.description],
  ];

  const wsProfile = XLSX.utils.aoa_to_sheet(profileData);
  XLSX.utils.book_append_sheet(wb, wsProfile, 'Ringkasan Rapor');

  // Sheet 2: Riwayat Transaksi
  const txHeaders = ['No', 'Tanggal', 'Jenis', 'Poin', 'Kategori', 'Uraian / Judul', 'Detail Keterangan', 'Admin Pencatat'];
  const txRows = transactions.map((t, index) => [
    index + 1,
    formatDateIndo(t.timestamp),
    t.type === 'prestasi' ? 'Prestasi (+)' : 'Pelanggaran (-)',
    t.type === 'prestasi' ? `+${t.points}` : `-${t.points}`,
    t.category,
    t.title,
    t.description,
    t.recordedByAdminName,
  ]);

  const wsTx = XLSX.utils.aoa_to_sheet([txHeaders, ...txRows]);
  XLSX.utils.book_append_sheet(wb, wsTx, 'Riwayat Transaksi');

  const fileName = `Rapor_Poin_${user.name.replace(/\s+/g, '_')}_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// 2. Export Excel for Admin (Rekap Seluruh Pengurus)
export function exportAdminMasterExcel(users: User[], transactions: PointTransaction[]): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Rekap Seluruh Pengurus
  const userHeaders = [
    'No',
    'Nama Lengkap',
    'NIS',
    'Kelas',
    'Organisasi',
    'Divisi / Sekbid',
    'Jabatan',
    'Poin Saat Ini',
    'Status Evaluasi',
    'Tingkat SP',
    'Total Prestasi Dicatat',
    'Total Pelanggaran Dicatat',
  ];

  const userRows = users
    .filter(u => u.role === 'pengurus' || u.role === 'admin')
    .map((u, i) => {
      const userTx = transactions.filter(t => t.userId === u.id);
      const presCount = userTx.filter(t => t.type === 'prestasi').length;
      const pelCount = userTx.filter(t => t.type === 'pelanggaran').length;
      const badge = getStatusBadge(u.currentPoints);

      return [
        i + 1,
        u.name,
        u.nis,
        u.classGrade,
        u.organization,
        u.division,
        u.position,
        u.currentPoints,
        badge.label,
        badge.spLevel > 0 ? `SP ${badge.spLevel}` : 'Normal',
        presCount,
        pelCount,
      ];
    });

  const wsUsers = XLSX.utils.aoa_to_sheet([
    ['REKAPITULASI POIN PENGURUS OSIS - MPK 06 BANDUNG'],
    [`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`],
    [''],
    userHeaders,
    ...userRows,
  ]);
  XLSX.utils.book_append_sheet(wb, wsUsers, 'Rekap Pengurus');

  // Sheet 2: Log Seluruh Transaksi
  const txHeaders = ['No', 'Tanggal', 'Nama Pengurus', 'Divisi', 'Jenis', 'Poin', 'Kategori', 'Judul Kejadian', 'Keterangan', 'Admin Pencatat'];
  const txRows = transactions.map((t, index) => [
    index + 1,
    formatDateIndo(t.timestamp),
    t.userName,
    t.userDivision,
    t.type.toUpperCase(),
    t.type === 'prestasi' ? `+${t.points}` : `-${t.points}`,
    t.category,
    t.title,
    t.description,
    t.recordedByAdminName,
  ]);

  const wsTx = XLSX.utils.aoa_to_sheet([
    ['LOG LENGKAP TRANSAKSI POIN KEDISIPLINAN & PRESTASI'],
    [''],
    txHeaders,
    ...txRows,
  ]);
  XLSX.utils.book_append_sheet(wb, wsTx, 'Log Transaksi');

  const fileName = `Rekap_Master_Poin_OSIS_MPK_06_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// 3. Export PDF for Individual Member (Rapor Poin Pribadi)
export function exportMemberPDF(user: User, transactions: PointTransaction[]): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 16;

  // Header / Kop Surat Resmi
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('PEMERINTAH DAERAH PROVINSI JAWA BARAT', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text('DINAS PENDIDIKAN - CABANG DINAS WILAYAH VII', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFontSize(13);
  doc.text('SMA NEGERI 6 BANDUNG', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Jl. Pasirkaliki No. 102, Pasir Kaliki, Kec. Cicendo, Kota Bandung, Jawa Barat 40171', pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.text('Website: sman6bdg.sch.id | Email: osis.mpk06@sman6bdg.sch.id', pageWidth / 2, y, { align: 'center' });
  y += 3;

  // Garis Pembatas Kop
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.8);
  doc.line(14, y, pageWidth - 14, y);
  doc.setLineWidth(0.3);
  doc.line(14, y + 0.8, pageWidth - 14, y + 0.8);
  y += 8;

  // Judul Dokumen
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('RAPOR POIN KEDISIPLINAN & PRESTASI PENGURUS', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Tahun Kepengurusan 2026/2027 • Tanggal Cetak: ${formatDateShort(new Date().toISOString())}`, pageWidth / 2, y, { align: 'center' });
  y += 8;

  // Identitas Pengurus Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, pageWidth - 28, 30, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  const col1X = 18;
  const col2X = 55;
  const col3X = 110;
  const col4X = 145;
  let bioY = y + 7;

  doc.setFont('helvetica', 'bold');
  doc.text('Nama Pengurus', col1X, bioY);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${user.name}`, col2X, bioY);

  doc.setFont('helvetica', 'bold');
  doc.text('Organisasi', col3X, bioY);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${user.organization}`, col4X, bioY);

  bioY += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('NIS / Kelas', col1X, bioY);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${user.nis} / ${user.classGrade}`, col2X, bioY);

  doc.setFont('helvetica', 'bold');
  doc.text('Divisi / Sekbid', col3X, bioY);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${user.division}`, col4X, bioY);

  bioY += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Jabatan', col1X, bioY);
  doc.setFont('helvetica', 'normal');
  doc.text(`: ${user.position}`, col2X, bioY);

  const status = getStatusBadge(user.currentPoints);
  doc.setFont('helvetica', 'bold');
  doc.text('Status Poin', col3X, bioY);
  doc.text(`: ${status.label} (${user.currentPoints} Poin)`, col4X, bioY);

  y += 36;

  // Poin Card Highlights
  const cardWidth = (pageWidth - 28 - 6) / 3;
  const totalPrestasi = transactions
    .filter(t => t.type === 'prestasi')
    .reduce((acc, curr) => acc + curr.points, 0);
  const totalPelanggaran = transactions
    .filter(t => t.type === 'pelanggaran')
    .reduce((acc, curr) => acc + curr.points, 0);

  // Card 1: Total Poin
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, y, cardWidth, 18, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('AKUMULASI POIN AKHIR', 14 + cardWidth / 2, y + 6, { align: 'center' });
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${user.currentPoints} Poin`, 14 + cardWidth / 2, y + 14, { align: 'center' });

  // Card 2: Prestasi
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(14 + cardWidth + 3, y, cardWidth, 18, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(5, 150, 105);
  doc.text('TOTAL PRESTASI (+)', 14 + cardWidth + 3 + cardWidth / 2, y + 6, { align: 'center' });
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(4, 120, 87);
  doc.text(`+${totalPrestasi} Poin`, 14 + cardWidth + 3 + cardWidth / 2, y + 14, { align: 'center' });

  // Card 3: Pelanggaran
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(14 + (cardWidth + 3) * 2, y, cardWidth, 18, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 38, 38);
  doc.text('TOTAL PENGURANGAN (-)', 14 + (cardWidth + 3) * 2 + cardWidth / 2, y + 6, { align: 'center' });
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.text(`-${totalPelanggaran} Poin`, 14 + (cardWidth + 3) * 2 + cardWidth / 2, y + 14, { align: 'center' });

  y += 24;

  // Section Header: Riwayat Transaksi
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('RIWAYAT PENCATATAN POIN REAL-TIME', 14, y);
  y += 4;

  // Manual Table Drawing for jsPDF
  const colWidths = [10, 24, 22, 16, 68, 42]; // sum = 182 (fits inside 182mm)
  const headers = ['No', 'Tanggal', 'Jenis', 'Poin', 'Kejadian / Pelanggaran / Prestasi', 'Pencatat'];

  doc.setFillColor(30, 41, 59);
  doc.rect(14, y, pageWidth - 28, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);

  let currentX = 14;
  headers.forEach((h, i) => {
    doc.text(h, currentX + 2, y + 5);
    currentX += colWidths[i];
  });
  y += 7;

  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  if (transactions.length === 0) {
    doc.setTextColor(100, 116, 139);
    doc.text('Belum ada transaksi poin yang tercatat untuk pengurus ini.', 14 + 5, y + 6);
    y += 10;
  } else {
    transactions.slice(0, 15).forEach((t, i) => {
      // Check page break
      if (y > 240) {
        doc.addPage();
        y = 16;
      }

      const rowHeight = 8;
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y, pageWidth - 28, rowHeight, 'F');
      }

      doc.setTextColor(51, 65, 85);
      let cellX = 14;

      // No
      doc.text(String(i + 1), cellX + 2, y + 5);
      cellX += colWidths[0];

      // Tanggal
      doc.text(formatDateShort(t.timestamp), cellX + 2, y + 5);
      cellX += colWidths[1];

      // Jenis
      if (t.type === 'prestasi') {
        doc.setTextColor(16, 185, 129);
        doc.text('Prestasi', cellX + 2, y + 5);
      } else {
        doc.setTextColor(239, 68, 68);
        doc.text('Pelanggaran', cellX + 2, y + 5);
      }
      cellX += colWidths[2];

      // Poin
      doc.setFont('helvetica', 'bold');
      doc.text(t.type === 'prestasi' ? `+${t.points}` : `-${t.points}`, cellX + 2, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      cellX += colWidths[3];

      // Judul (truncated to fit)
      const titleShort = t.title.length > 42 ? t.title.substring(0, 40) + '...' : t.title;
      doc.text(titleShort, cellX + 2, y + 5);
      cellX += colWidths[4];

      // Pencatat
      const recorderShort = t.recordedByAdminName.length > 25 ? t.recordedByAdminName.substring(0, 23) + '..' : t.recordedByAdminName;
      doc.text(recorderShort, cellX + 2, y + 5);

      y += rowHeight;
    });
  }

  // Tanda Tangan Pengesahan (Legal Signature Block)
  y = Math.max(y + 12, 235);
  if (y > 250) {
    doc.addPage();
    y = 25;
  }

  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  const signLeftX = 24;
  const signRightX = pageWidth - 65;

  doc.text('Mengetahui,', signLeftX, y);
  doc.text('Bandung, ' + formatDateShort(new Date().toISOString()), signRightX, y);
  y += 4;
  doc.text('Ketua MPK 06 Bandung', signLeftX, y);
  doc.text('Pembina OSIS SMAN 6 Bandung', signRightX, y);

  y += 18; // space for digital stamp/sign
  doc.setFont('helvetica', 'bold');
  doc.text('Ahmad Faiz Zulkarnaen', signLeftX, y);
  doc.text('Drs. H. Rahmat Sudrajat, M.Pd.', signRightX, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('NIS. 232410042', signLeftX, y);
  doc.text('NIP. 19740512 200112 1 002', signRightX, y);

  doc.save(`Rapor_Poin_${user.name.replace(/\s+/g, '_')}.pdf`);
}

// 4. Export PDF for Admin (Rekap Kolektif)
export function exportAdminMasterPDF(users: User[], transactions: PointTransaction[]): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 14;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('SMA NEGERI 6 BANDUNG - MAJELIS PERWAKILAN KELAS & OSIS', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFontSize(13);
  doc.text('REKAPITULASI POIN KEDISIPLINAN & PRESTASI SELURUH PENGURUS', pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Dicetak pada: ${formatDateIndo(new Date().toISOString())} • Status Kepengurusan Periode 2026/2027`, pageWidth / 2, y, { align: 'center' });
  y += 6;

  // Garis
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.6);
  doc.line(14, y, pageWidth - 14, y);
  y += 6;

  // Headers
  const colWidths = [10, 50, 24, 20, 55, 40, 22, 45];
  const headers = ['No', 'Nama Pengurus', 'NIS', 'Kelas', 'Divisi / Sekbid', 'Jabatan', 'Poin', 'Status Evaluasi'];

  doc.setFillColor(30, 41, 59);
  doc.rect(14, y, pageWidth - 28, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);

  let currentX = 14;
  headers.forEach((h, i) => {
    doc.text(h, currentX + 2, y + 5);
    currentX += colWidths[i];
  });
  y += 7;

  // Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  users.forEach((u, i) => {
    if (y > 180) {
      doc.addPage();
      y = 16;
    }

    const rowHeight = 7;
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, pageWidth - 28, rowHeight, 'F');
    }

    doc.setTextColor(51, 65, 85);
    let cellX = 14;

    doc.text(String(i + 1), cellX + 2, y + 5);
    cellX += colWidths[0];

    doc.text(u.name.length > 28 ? u.name.substring(0, 26) + '..' : u.name, cellX + 2, y + 5);
    cellX += colWidths[1];

    doc.text(u.nis, cellX + 2, y + 5);
    cellX += colWidths[2];

    doc.text(u.classGrade, cellX + 2, y + 5);
    cellX += colWidths[3];

    doc.text(u.division.length > 30 ? u.division.substring(0, 28) + '..' : u.division, cellX + 2, y + 5);
    cellX += colWidths[4];

    doc.text(u.position, cellX + 2, y + 5);
    cellX += colWidths[5];

    // Poin
    doc.setFont('helvetica', 'bold');
    if (u.currentPoints >= 100) doc.setTextColor(5, 150, 105);
    else if (u.currentPoints >= 85) doc.setTextColor(37, 99, 235);
    else if (u.currentPoints >= 70) doc.setTextColor(217, 119, 6);
    else doc.setTextColor(220, 38, 38);

    doc.text(String(u.currentPoints), cellX + 2, y + 5);
    doc.setFont('helvetica', 'normal');
    cellX += colWidths[6];

    const badge = getStatusBadge(u.currentPoints);
    doc.text(badge.label, cellX + 2, y + 5);

    y += rowHeight;
  });

  doc.save(`Rekap_Master_Poin_OSIS_MPK_06_${Date.now()}.pdf`);
}
