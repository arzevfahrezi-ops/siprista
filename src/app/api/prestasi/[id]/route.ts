import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get prestasi by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const prestasi = await db.prestasi.findUnique({
      where: { id },
      include: {
        siswa: true,
        guru: {
          select: {
            id: true,
            name: true,
            email: true,
            nip: true,
          },
        },
      },
    })

    if (!prestasi) {
      return NextResponse.json(
        { error: 'Prestasi tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: prestasi })
  } catch (error) {
    console.error('Error fetching prestasi:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// PUT - Update prestasi
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Check if prestasi exists
    const existingPrestasi = await db.prestasi.findUnique({
      where: { id },
    })

    if (!existingPrestasi) {
      return NextResponse.json(
        { error: 'Prestasi tidak ditemukan' },
        { status: 404 }
      )
    }

    // Validate siswa if provided
    if (siswaId) {
      const siswa = await db.siswa.findUnique({
        where: { id: siswaId },
      })

      if (!siswa) {
        return NextResponse.json(
          { error: 'Siswa tidak ditemukan' },
          { status: 400 }
        )
      }
    }

    // Validate guru if provided
    if (guruId) {
      const guru = await db.user.findUnique({
        where: { id: guruId },
      })

      if (!guru) {
        return NextResponse.json(
          { error: 'Guru tidak ditemukan' },
          { status: 400 }
        )
      }
    }

    const prestasi = await db.prestasi.update({
      where: { id },
      data: {
        ...(siswaId && { siswaId }),
        ...(guruId && { guruId }),
        ...(jenisPrestasi && { jenisPrestasi }),
        ...(namaPrestasi && { namaPrestasi }),
        ...(tingkat && { tingkat }),
        ...(penyelenggara !== undefined && { penyelenggara }),
        ...(tanggal && { tanggal: new Date(tanggal) }),
        ...(deskripsi !== undefined && { deskripsi }),
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
      message: 'Prestasi berhasil diperbarui',
      data: prestasi,
    })
  } catch (error) {
    console.error('Error updating prestasi:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// DELETE - Delete prestasi
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Check if prestasi exists
    const existingPrestasi = await db.prestasi.findUnique({
      where: { id },
    })

    if (!existingPrestasi) {
      return NextResponse.json(
        { error: 'Prestasi tidak ditemukan' },
        { status: 404 }
      )
    }

    await db.prestasi.delete({
      where: { id },
    })

    return NextResponse.json({
      message: 'Prestasi berhasil dihapus',
    })
  } catch (error) {
    console.error('Error deleting prestasi:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}