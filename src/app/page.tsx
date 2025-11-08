'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import { Award, Users, BookOpen, TrendingUp, School, Trophy, Star, Calendar } from 'lucide-react'

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [isAchievementsLoading, setIsAchievementsLoading] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: ''
  })
  const [prestasiList, setPrestasiList] = useState([])
  const router = useRouter()
  const { toast } = useToast()
  const { login } = useAuth()

  // Fetch prestasi data for public display
  const fetchPrestasiData = async () => {
    try {
      const response = await fetch('/api/prestasi?public=true&limit=10')
      const data = await response.json()
      setPrestasiList(data.data || [])
    } catch (error) {
      console.error('Error fetching prestasi data:', error)
    } finally {
      setIsAchievementsLoading(false)
    }
  }

  useEffect(() => {
    fetchPrestasiData()
  }, [])

  // Helper functions untuk format data
  const formatJenisPrestasi = (jenis: string) => {
    const jenisMap: { [key: string]: string } = {
      'AKADEMIK': 'Akademik',
      'NON_AKADEMIK': 'Non-Akademik',
      'EKSTRAKURIKULER': 'Ekstrakurikuler',
      'LAINNYA': 'Lainnya'
    }
    return jenisMap[jenis] || jenis
  }

  const formatTingkat = (tingkat: string) => {
    const tingkatMap: { [key: string]: string } = {
      'SEKOLAH': 'Sekolah',
      'KECAMATAN': 'Kecamatan',
      'KABUPATEN': 'Kabupaten',
      'PROVINSI': 'Provinsi',
      'NASIONAL': 'Nasional',
      'INTERNASIONAL': 'Internasional'
    }
    return tingkatMap[tingkat] || tingkat
  }

  const getTingkatColor = (tingkat: string) => {
    const colorMap: { [key: string]: string } = {
      'SEKOLAH': 'bg-gray-100 text-gray-800',
      'KECAMATAN': 'bg-blue-100 text-blue-800',
      'KABUPATEN': 'bg-green-100 text-green-800',
      'PROVINSI': 'bg-yellow-100 text-yellow-800',
      'NASIONAL': 'bg-orange-100 text-orange-800',
      'INTERNASIONAL': 'bg-red-100 text-red-800'
    }
    return colorMap[tingkat] || 'bg-gray-100 text-gray-800'
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.email || !formData.password || !formData.role) {
      toast({
        title: "Error",
        description: "Semua field harus diisi",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const result = await login(formData.email, formData.password, formData.role)
      if (result.success) {
        toast({
          title: "Berhasil",
          description: "Login berhasil! Mengarahkan ke dashboard...",
        })
        // Redirect berdasarkan role
        setTimeout(() => {
          if (formData.role === 'admin') {
            router.push('/admin')
          } else {
            router.push('/guru')
          }
        }, 1000)
      } else {
        toast({
          title: "Error",
          description: result.error || "Login gagal",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan koneksi",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-slate-600 to-slate-700 rounded-lg flex items-center justify-center">
                <School className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                SIPRISTA
              </h1>
            </div>
            <Badge variant="outline" className="text-xs">
              Sistem Informasi Prestasi Siswa
            </Badge>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">
                Kelola Prestasi Siswa dengan
                <span className="bg-gradient-to-r from-slate-600 to-slate-800 bg-clip-text text-transparent">
                  {" "}Lebih Mudah
                </span>
              </h2>
              <p className="text-lg text-gray-600">
                Sistem informasi terpadu untuk mencatat, memantau, dan melaporkan prestasi siswa secara digital dan terstruktur.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                <Trophy className="w-8 h-8 text-slate-600" />
                <div>
                  <p className="font-semibold text-gray-900">Tracking Prestasi</p>
                  <p className="text-sm text-gray-600">Real-time & Akurat</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <TrendingUp className="w-8 h-8 text-gray-600" />
                <div>
                  <p className="font-semibold text-gray-900">Analitik Data</p>
                  <p className="text-sm text-gray-600">Komprehensif</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                <Users className="w-8 h-8 text-slate-600" />
                <div>
                  <p className="font-semibold text-gray-900">Multi-User</p>
                  <p className="text-sm text-gray-600">Admin & Guru</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <BookOpen className="w-8 h-8 text-gray-600" />
                <div>
                  <p className="font-semibold text-gray-900">Laporan</p>
                  <p className="text-sm text-gray-600">Otomatis & Lengkap</p>
                </div>
              </div>
            </div>
          </div>

          {/* Login Card */}
          <div className="flex justify-center">
            <Card className="w-full max-w-md shadow-xl border-0">
              <CardHeader className="text-center space-y-2">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-slate-600 to-slate-700 rounded-full flex items-center justify-center mb-4">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold">Selamat Datang</CardTitle>
                <CardDescription>
                  Masuk ke akun SIPRISTA Anda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Masukkan password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Login Sebagai</Label>
                    <Select 
                      value={formData.role} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="guru">Guru</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800"
                    disabled={isLoading}
                  >
                    {isLoading ? "Memproses..." : "Masuk"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Prestasi Siswa Section */}
      <section className="bg-gradient-to-b from-slate-50 to-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Trophy className="w-8 h-8 text-slate-600" />
              <h3 className="text-3xl font-bold text-gray-900">
                Daftar Prestasi Siswa
              </h3>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Kumpulan prestasi terbaru dari siswa-siswa berprestasi
            </p>
          </div>

          <Card className="max-w-6xl mx-auto shadow-lg border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-slate-600" />
                  <CardTitle className="text-xl">Prestasi Terbaru</CardTitle>
                </div>
                <Badge variant="outline" className="text-sm">
                  {prestasiList.length} Prestasi
                </Badge>
              </div>
              <CardDescription>
                Menampilkan {prestasiList.length} prestasi terbaru dari siswa-siswa terbaik
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isAchievementsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
                  <span className="ml-2 text-gray-600">Memuat data prestasi...</span>
                </div>
              ) : prestasiList.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Belum ada data prestasi</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Data prestasi akan ditampilkan setelah guru menambahkan prestasi siswa
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Siswa</TableHead>
                        <TableHead>Prestasi</TableHead>
                        <TableHead>Jenis</TableHead>
                        <TableHead>Tingkat</TableHead>
                        <TableHead>Tanggal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prestasiList.map((prestasi: any, index: number) => (
                        <TableRow key={prestasi.id || index} className="hover:bg-slate-50">
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">{prestasi.siswa?.nama || 'Unknown'}</p>
                              <p className="text-sm text-gray-500">{prestasi.siswa?.kelas || '-'}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium text-gray-900">{prestasi.namaPrestasi}</p>
                            {prestasi.penyelenggara && (
                              <p className="text-sm text-gray-500">{prestasi.penyelenggara}</p>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {formatJenisPrestasi(prestasi.jenisPrestasi)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-xs ${getTingkatColor(prestasi.tingkat)}`}>
                              {formatTingkat(prestasi.tingkat)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1 text-sm text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {new Date(prestasi.tanggal).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Fitur Unggulan SIPRISTA
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Solusi lengkap untuk manajemen prestasi siswa di sekolah Anda
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-slate-600" />
                </div>
                <CardTitle>Manajemen Siswa</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Kelola data siswa, kelas, dan informasi akademik dengan mudah dan terstruktur.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <Trophy className="w-6 h-6 text-gray-600" />
                </div>
                <CardTitle>Tracking Prestasi</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Catat dan pantau berbagai jenis prestasi siswa dari tingkat sekolah hingga internasional.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-slate-600" />
                </div>
                <CardTitle>Laporan & Statistik</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Hasilkan laporan komprehensif dan analitik prestasi untuk kebutuhan sekolah.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-slate-600 to-slate-700 rounded-lg flex items-center justify-center">
              <School className="w-5 h-5 text-white" />
            </div>
            <h4 className="text-xl font-bold">SIPRISTA</h4>
          </div>
          <p className="text-slate-300">
            Sistem Informasi Prestasi Siswa - © 2024
          </p>
        </div>
      </footer>
    </div>
  )
}