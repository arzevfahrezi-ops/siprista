import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Create admin user
  const adminPassword = await bcrypt.hash('demo123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@siprista.com' },
    update: {},
    create: {
      email: 'admin@siprista.com',
      name: 'Administrator SIPRISTA',
      password: adminPassword,
      role: 'ADMIN',
      nip: 'ADMIN001'
    },
  })

  // Create guru user
  const guruPassword = await bcrypt.hash('demo123', 10)
  const guru = await prisma.user.upsert({
    where: { email: 'guru@siprista.com' },
    update: {},
    create: {
      email: 'guru@siprista.com',
      name: 'Guru SIPRISTA',
      password: guruPassword,
      role: 'GURU',
      nip: '198001012001'
    },
  })

  // Create sample siswa
  const siswa1 = await prisma.siswa.upsert({
    where: { nis: '2024001' },
    update: {},
    create: {
      nis: '2024001',
      nama: 'Ahmad Rizki',
      kelas: 'XII IPA 1',
      jurusan: 'IPA',
      jenisKelamin: 'LAKI_LAKI',
      tanggalLahir: new Date('2006-05-15'),
      alamat: 'Jl. Merdeka No. 123, Jakarta'
    },
  })

  const siswa2 = await prisma.siswa.upsert({
    where: { nis: '2024002' },
    update: {},
    create: {
      nis: '2024002',
      nama: 'Siti Nurhaliza',
      kelas: 'XII IPS 2',
      jurusan: 'IPS',
      jenisKelamin: 'PEREMPUAN',
      tanggalLahir: new Date('2006-08-20'),
      alamat: 'Jl. Sudirman No. 456, Jakarta'
    },
  })

  const siswa3 = await prisma.siswa.upsert({
    where: { nis: '2024003' },
    update: {},
    create: {
      nis: '2024003',
      nama: 'Budi Santoso',
      kelas: 'XI IPA 3',
      jurusan: 'IPA',
      jenisKelamin: 'LAKI_LAKI',
      tanggalLahir: new Date('2007-01-10'),
      alamat: 'Jl. Gatot Subroto No. 789, Jakarta'
    },
  })

  // Create sample prestasi
  await prisma.prestasi.upsert({
    where: { id: '1' },
    update: {},
    create: {
      siswaId: siswa1.id,
      guruId: guru.id,
      jenisPrestasi: 'AKADEMIK',
      namaPrestasi: 'Juara 1 Olimpiade Matematika',
      tingkat: 'PROVINSI',
      penyelenggara: 'Dinas Pendidikan Provinsi DKI',
      tanggal: new Date('2024-01-15'),
      deskripsi: 'Meraih juara 1 dalam Olimpiade Matematika tingkat Provinsi DKI Jakarta'
    },
  })

  await prisma.prestasi.upsert({
    where: { id: '2' },
    update: {},
    create: {
      siswaId: siswa2.id,
      guruId: guru.id,
      jenisPrestasi: 'NON_AKADEMIK',
      namaPrestasi: 'Best Speaker English Debate',
      tingkat: 'NASIONAL',
      penyelenggara: 'Universitas Indonesia',
      tanggal: new Date('2024-01-20'),
      deskripsi: 'Meraih penghargaan Best Speaker dalam kompetisi English Debate tingkat Nasional'
    },
  })

  await prisma.prestasi.upsert({
    where: { id: '3' },
    update: {},
    create: {
      siswaId: siswa3.id,
      guruId: guru.id,
      jenisPrestasi: 'EKSTRAKURIKULER',
      namaPrestasi: 'Juara 2 Lomba Pidato',
      tingkat: 'KABUPATEN',
      penyelenggara: 'Pemerintah Kabupaten Bekasi',
      tanggal: new Date('2024-01-25'),
      deskripsi: 'Meraih juara 2 dalam Lomba Pidato tingkat Kabupaten Bekasi'
    },
  })

  console.log('Seeding finished.')
  console.log(`Created admin: ${admin.email}`)
  console.log(`Created guru: ${guru.email}`)
  console.log(`Created 3 siswa and 3 prestasi`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })