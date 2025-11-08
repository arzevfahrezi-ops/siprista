import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - List all prestasi
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const tingkat = searchParams.get('tingkat') || ''
    const jenisPrestasi = searchParams.get('jenisPrestasi') || ''
    const guruId = searchParams.get('guruId') || ''
    const isPublic = searchParams.get('public') === 'true'

    const skip = (page - 1) * limit

    const where: any = {}

    if (search) {
      where.OR = [
        { namaPrestasi: { contains: search, mode: 'insensitive' } },
        { siswa: { nama: { contains: search, mode: 'insensitive' } } },
        { penyelenggara: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (tingkat) {
      where.tingkat = tingkat
    }

    if (jenisPrestasi) {
      where.jenisPrestasi = jenisPrestasi
    }

    if (guruId) {
      where.guruId = guruId
    }

    const [prestasi, total] = await Promise.all([
      db.prestasi.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          siswa: {
            select: {
              id: true,
              nis: true,
              nama: true,
              kelas: true,
            },
          },
          // Only include guru data if not public access
          ...(isPublic ? {} : {
            guru: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          }),
        },
      }),
      db.prestasi.count({ where }),
    ])

    return NextResponse.json({
      data: prestasi,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching prestasi:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// POST - Create new prestasi
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      siswaId,
      guruId,
      jenisPrestasi,
      namaPrestasi,
      tingkat,
      penyelenggara,
      tanggal,
      deskripsi,
    } = body

    // Validasi required fields
    if (!siswaId || !guruId || !jenisPrestasi || !namaPrestasi || !tingkat || !tanggal) {
      return NextResponse.json(
        { error: 'Field siswa, guru, jenis prestasi, nama prestasi, tingkat, dan tanggal harus diisi' },
        { status: 400 }
      )
    }

    // Check if siswa exists
    const siswa = await db.siswa.findUnique({
      where: { id: siswaId },
    })

    if (!siswa) {
      return NextResponse.json(
        { error: 'Siswa tidak ditemukan' },
        { status: 400 }
      )
    }

    // Check if guru exists
    const guru = await db.user.findUnique({
      where: { id: guruId },
    })

    if (!guru) {
      return NextResponse.json(
        { error: 'Guru tidak ditemukan' },
        { status: 400 }
      )
    }

    const prestasi = await db.prestasi.create({
      data: {
        siswaId,
        guruId,
        jenisPrestasi,
        namaPrestasi,
        tingkat,
        penyelenggara,
        tanggal: new Date(tanggal),
        deskripsi,
      },
      include: {
        siswa: {
          select: {
            id: true,
            nis: true,
            nama: true,
            kelas: true,
          },
        },
        guru: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: 'Prestasi berhasil ditambahkan',
      data: prestasi,
    })
  } catch (error) {
    console.error('Error creating prestasi:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}