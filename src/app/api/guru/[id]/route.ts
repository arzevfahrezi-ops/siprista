import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// GET - Get guru by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const guru = await db.user.findUnique({
      where: { id: params.id, role: 'GURU' },
      select: {
        id: true,
        email: true,
        name: true,
        nip: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        prestasiCreated: {
          include: {
            siswa: {
              select: {
                id: true,
                nis: true,
                nama: true,
                kelas: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!guru) {
      return NextResponse.json(
        { error: 'Guru tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: guru })
  } catch (error) {
    console.error('Error fetching guru:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// PUT - Update guru
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      email,
      name,
      password,
      nip,
    } = body

    // Check if guru exists
    const existingGuru = await db.user.findUnique({
      where: { id: params.id, role: 'GURU' },
    })

    if (!existingGuru) {
      return NextResponse.json(
        { error: 'Guru tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if email already exists (excluding current guru)
    if (email && email !== existingGuru.email) {
      const duplicateUser = await db.user.findUnique({
        where: { email },
      })

      if (duplicateUser) {
        return NextResponse.json(
          { error: 'Email sudah terdaftar' },
          { status: 400 }
        )
      }
    }

    // Check if NIP already exists (excluding current guru)
    if (nip && nip !== existingGuru.nip) {
      const duplicateNIP = await db.user.findUnique({
        where: { nip },
      })

      if (duplicateNIP) {
        return NextResponse.json(
          { error: 'NIP sudah terdaftar' },
          { status: 400 }
        )
      }
    }

    const updateData: any = {
      ...(email && { email }),
      ...(name && { name }),
      ...(nip !== undefined && { nip }),
    }

    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    const guru = await db.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        nip: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      message: 'Data guru berhasil diperbarui',
      data: guru,
    })
  } catch (error) {
    console.error('Error updating guru:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// DELETE - Delete guru
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if guru exists
    const existingGuru = await db.user.findUnique({
      where: { id: params.id, role: 'GURU' },
    })

    if (!existingGuru) {
      return NextResponse.json(
        { error: 'Guru tidak ditemukan' },
        { status: 404 }
      )
    }

    // Check if guru has associated prestasi
    const prestasiCount = await db.prestasi.count({
      where: { guruId: params.id },
    })

    if (prestasiCount > 0) {
      return NextResponse.json(
        { error: 'Tidak dapat menghapus guru yang memiliki data prestasi terkait' },
        { status: 400 }
      )
    }

    await db.user.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      message: 'Guru berhasil dihapus',
    })
  } catch (error) {
    console.error('Error deleting guru:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}