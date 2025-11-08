import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password, role } = await request.json()

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Email, password, dan role harus diisi' },
        { status: 400 }
      )
    }

    // Cari user berdasarkan email dan role
    const user = await db.user.findUnique({
      where: {
        email: email,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 401 }
      )
    }

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Password salah' },
        { status: 401 }
      )
    }

    // Verifikasi role
    if (user.role !== role.toUpperCase()) {
      return NextResponse.json(
        { error: 'Role tidak sesuai' },
        { status: 401 }
      )
    }

    // Return user data tanpa password
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      message: 'Login berhasil',
      user: userWithoutPassword
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}