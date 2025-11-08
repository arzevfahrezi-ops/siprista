import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get siswa by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const siswa = await db.siswa.findUnique({
      where: { id: params.id },
      include: {
        prestasi: {
          include: {
            guru: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { tanggal: 'desc' },
        },
      },
    })

    if (!siswa) {
      return NextResponse.json(
        { error: 'Siswa tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: siswa })
  } catch (error) {
    console.error('Error fetching siswa:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// PUT - Update siswa
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if siswa exists
    const existingSiswa = await db.siswa.findUnique({
      where: { id: params.id },
    })

    if (!existingSiswa) {
      return NextResponse.json(
        { error: 'Siswa tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if NIS already exists (excluding current siswa)
    if (nis && nis !== existingSiswa.nis) {
      const duplicateSiswa = await db.siswa.findUnique({
        where: { nis },
      })

      if (duplicateSiswa) {
        return NextResponse.json(
          { error: 'NIS sudah terdaftar' },
          { status: 400 }
        )
      }
    }

    const siswa = await db.siswa.update({
      where: { id: params.id },
      data: {
        ...(nis && { nis }),
        ...(nama && { nama }),
        ...(kelas && { kelas }),
        ...(jenisKelamin && { jenisKelamin }),
        ...(tanggalLahir && { tanggalLahir: new Date(tanggalLahir) }),
        ...(alamat !== undefined && { alamat }),
      },
    })

    return NextResponse.json({
      message: 'Siswa berhasil diperbarui',
      data: siswa,
    })
  } catch (error) {
    console.error('Error updating siswa:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// DELETE - Delete siswa
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if siswa exists
    const existingSiswa = await db.siswa.findUnique({
      where: { id: params.id },
    })

    if (!existingSiswa) {
      return NextResponse.json(
        { error: 'Siswa tidak ditemukan' },
        { status: 404 }
      )
    }

    await db.siswa.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      message: 'Siswa berhasil dihapus',
    })
  } catch (error) {
    console.error('Error deleting siswa:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}