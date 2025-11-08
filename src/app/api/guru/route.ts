import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// GET - List all guru
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    const where = {
      role: 'GURU',
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { nip: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [guru, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          nip: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              prestasiCreated: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.user.count({ where }),
    ])

    return NextResponse.json({
      data: guru,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching guru:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// POST - Create new guru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      email,
      name,
      password,
      nip,
    } = body

    // Validasi required fields
    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'Email, nama, dan password harus diisi' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar' },
        { status: 400 }
      )
    }

    // Check if NIP already exists
    if (nip) {
      const existingNIP = await db.user.findUnique({
        where: { nip },
      })

      if (existingNIP) {
        return NextResponse.json(
          { error: 'NIP sudah terdaftar' },
          { status: 400 }
        )
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    const guru = await db.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: 'GURU',
        nip,
      },
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
      message: 'Guru berhasil ditambahkan',
      data: guru,
    })
  } catch (error) {
    console.error('Error creating guru:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}