import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - List all siswa
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    const where = search
      ? {
          OR: [
            { nama: { contains: search, mode: 'insensitive' as const } },
            { nis: { contains: search, mode: 'insensitive' as const } },
            { kelas: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [siswa, total] = await Promise.all([
      db.siswa.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          prestasi: {
            select: {
              id: true,
              namaPrestasi: true,
              tingkat: true,
              tanggal: true,
            },
          },
        },
      }),
      db.siswa.count({ where }),
    ])

    return NextResponse.json({
      data: siswa,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching siswa:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// POST - Create new siswa
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      nis,
      nama,
      kelas,
      jenisKelamin,
      tanggalLahir,
      alamat,
    } = body

    // Validasi required fields
    if (!nis || !nama || !kelas || !jenisKelamin) {
      return NextResponse.json(
        { error: 'Field NIS, nama, kelas, dan jenis kelamin harus diisi' },
        { status: 400 }
      )
    }

    // Check if NIS already exists
    const existingSiswa = await db.siswa.findUnique({
      where: { nis },
    })

    if (existingSiswa) {
      return NextResponse.json(
        { error: 'NIS sudah terdaftar' },
        { status: 400 }
      )
    }

    const siswa = await db.siswa.create({
      data: {
        nis,
        nama,
        kelas,
        jenisKelamin,
        tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : null,
        alamat,
      },
    })

    return NextResponse.json({
      message: 'Siswa berhasil ditambahkan',
      data: siswa,
    })
  } catch (error) {
    console.error('Error creating siswa:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}