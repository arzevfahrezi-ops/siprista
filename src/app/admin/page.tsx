'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { 
  Users, 
  Trophy, 
  UserCheck, 
  LogOut, 
  Plus, 
  Edit, 
  Trash2,
  School,
  Award,
  TrendingUp,
  Activity,
  Search,
  X,
  Download
} from 'lucide-react'

interface DashboardStats {
  totalSiswa: number
  totalGuru: number
  totalPrestasi: number
  prestasiBulanIni: number
}

interface Siswa {
  id: string
  nis: string
  nama: string
  kelas: string
  jenisKelamin: string
  tanggalLahir?: string
  alamat?: string
}

interface Guru {
  id: string
  email: string
  name: string
  nip?: string
  role: string
  _count: { prestasiCreated: number }
}

interface Prestasi {
  id: string
  siswaId: string
  siswa: { nama: string; kelas: string }
  namaPrestasi: string
  jenisPrestasi: string
  tingkat: string
  tanggal: string
  guru: { name: string }
  guruId: string
  penyelenggara?: string
  deskripsi?: string
}

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [stats, setStats] = useState<DashboardStats>({
    totalSiswa: 0,
    totalGuru: 0,
    totalPrestasi: 0,
    prestasiBulanIni: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [siswaList, setSiswaList] = useState<Siswa[]>([])
  const [guruList, setGuruList] = useState<Guru[]>([])
  const [prestasiList, setPrestasiList] = useState<Prestasi[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  
  // Form states
  const [showSiswaForm, setShowSiswaForm] = useState(false)
  const [showGuruForm, setShowGuruForm] = useState(false)
  const [editingSiswa, setEditingSiswa] = useState<Siswa | null>(null)
  const [editingGuru, setEditingGuru] = useState<Guru | null>(null)
  
  const [siswaForm, setSiswaForm] = useState({
    nis: '',
    nama: '',
    kelas: '',
    jenisKelamin: '',
    tanggalLahir: '',
    alamat: ''
  })
  
  const [guruForm, setGuruForm] = useState({
    email: '',
    name: '',
    password: '',
    nip: ''
  })

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.push('/')
      return
    }
    
    fetchDashboardData()
  }, [user, router])

  const fetchDashboardData = async () => {
    try {
      // Fetch stats
      const [siswaRes, guruRes, prestasiRes] = await Promise.all([
        fetch('/api/siswa'),
        fetch('/api/guru'),
        fetch('/api/prestasi')
      ])

      const siswaData = await siswaRes.json()
      const guruData = await guruRes.json()
      const prestasiData = await prestasiRes.json()

      setSiswaList(siswaData.data || [])
      setGuruList(guruData.data || [])
      setPrestasiList(prestasiData.data || [])

      // Calculate stats
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      
      const prestasiBulanIni = prestasiData.data?.filter((p: Prestasi) => {
        const prestasiDate = new Date(p.tanggal)
        return prestasiDate.getMonth() === currentMonth && prestasiDate.getFullYear() === currentYear
      }).length || 0

      setStats({
        totalSiswa: siswaData.pagination?.total || 0,
        totalGuru: guruData.pagination?.total || 0,
        totalPrestasi: prestasiData.pagination?.total || 0,
        prestasiBulanIni
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast({
        title: "Error",
        description: "Gagal memuat data dashboard",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/')
    toast({
      title: "Berhasil",
      description: "Anda telah keluar dari sistem",
    })
  }

  const handleAddSiswa = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/siswa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(siswaForm)
      })

      if (response.ok) {
        toast({
          title: "Berhasil",
          description: "Siswa berhasil ditambahkan",
        })
        setShowSiswaForm(false)
        setSiswaForm({
          nis: '',
          nama: '',
          kelas: '',
          jenisKelamin: '',
          tanggalLahir: '',
          alamat: ''
        })
        fetchDashboardData()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Gagal menambah siswa",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan koneksi",
        variant: "destructive",
      })
    }
  }

  const handleAddGuru = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/guru', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guruForm)
      })

      if (response.ok) {
        toast({
          title: "Berhasil",
          description: "Guru berhasil ditambahkan",
        })
        setShowGuruForm(false)
        setGuruForm({
          email: '',
          name: '',
          password: '',
          nip: ''
        })
        fetchDashboardData()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Gagal menambah guru",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan koneksi",
        variant: "destructive",
      })
    }
  }

  const handleDeleteSiswa = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data siswa ini?')) return

    try {
      const response = await fetch(`/api/siswa/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Berhasil",
          description: "Siswa berhasil dihapus",
        })
        fetchDashboardData()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Gagal menghapus siswa",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan koneksi",
        variant: "destructive",
      })
    }
  }

  const handleDeleteGuru = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data guru ini?')) return

    try {
      const response = await fetch(`/api/guru/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Berhasil",
          description: "Guru berhasil dihapus",
        })
        fetchDashboardData()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Gagal menghapus guru",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan koneksi",
        variant: "destructive",
      })
    }
  }

  const handleDeletePrestasi = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data prestasi ini?')) return

    try {
      const response = await fetch(`/api/prestasi/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Berhasil",
          description: "Prestasi berhasil dihapus",
        })
        fetchDashboardData()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Gagal menghapus prestasi",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan koneksi",
        variant: "destructive",
      })
    }
  }

  const filteredSiswa = siswaList.filter(siswa =>
    siswa.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    siswa.nis.toLowerCase().includes(searchTerm.toLowerCase()) ||
    siswa.kelas.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredGuru = guruList.filter(guru =>
    guru.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guru.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (guru.nip && guru.nip.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const filteredPrestasi = prestasiList.filter(prestasi =>
    prestasi.siswa.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prestasi.namaPrestasi.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Helper functions untuk enum
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

  // Statistik dinamis untuk laporan
  const laporanStats = {
    prestasiPerJenis: ['AKADEMIK', 'NON_AKADEMIK', 'EKSTRAKURIKULER', 'LAINNYA'].map(jenis => ({
      jenis: formatJenisPrestasi(jenis),
      count: prestasiList.filter(p => p.jenisPrestasi === jenis).length,
      percentage: prestasiList.length > 0 ? 
        ((prestasiList.filter(p => p.jenisPrestasi === jenis).length / prestasiList.length) * 100).toFixed(1) : '0'
    })),
    prestasiPerTingkat: ['SEKOLAH', 'KECAMATAN', 'KABUPATEN', 'PROVINSI', 'NASIONAL', 'INTERNASIONAL'].map(tingkat => ({
      tingkat: formatTingkat(tingkat),
      count: prestasiList.filter(p => p.tingkat === tingkat).length,
      percentage: prestasiList.length > 0 ? 
        ((prestasiList.filter(p => p.tingkat === tingkat).length / prestasiList.length) * 100).toFixed(1) : '0'
    })),
    topGuru: guruList
      .map(guru => ({
        ...guru,
        totalPrestasi: prestasiList.filter(p => p.guru.name === guru.name).length
      }))
      .sort((a, b) => b.totalPrestasi - a.totalPrestasi)
      .slice(0, 5),
    topSiswa: Array.from(
      new Map(
        prestasiList.map(p => [p.siswa.nama, {
          nama: p.siswa.nama,
          kelas: p.siswa.kelas,
          count: prestasiList.filter(prestasi => prestasi.siswa.nama === p.siswa.nama).length
        }])
      ).values()
    )
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    prestasiPerBulan: (() => {
      const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                         'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
      const currentYear = new Date().getFullYear()
      
      return monthNames.map((month, index) => ({
        month,
        count: prestasiList.filter(p => {
          const date = new Date(p.tanggal)
          return date.getMonth() === index && date.getFullYear() === currentYear
        }).length
      }))
    })()
  }

  // Export Functions
  const exportToPDF = () => {
    try {
      // Check if there's data to export
      if (prestasiList.length === 0) {
        toast({
          title: "Peringatan",
          description: "Tidak ada data prestasi untuk diekspor",
          variant: "destructive",
        })
        return
      }

      const doc = new jsPDF()
      
      // Add title
      doc.setFontSize(20)
      doc.text('Laporan Prestasi Siswa', 14, 20)
      doc.setFontSize(12)
      doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 30)
      
      // Add statistics
      doc.setFontSize(14)
      doc.text('Statistik Umum', 14, 45)
      doc.setFontSize(11)
      doc.text(`Total Siswa: ${stats.totalSiswa}`, 14, 55)
      doc.text(`Total Guru: ${stats.totalGuru}`, 14, 62)
      doc.text(`Total Prestasi: ${stats.totalPrestasi}`, 14, 69)
      doc.text(`Prestasi Bulan Ini: ${stats.prestasiBulanIni}`, 14, 76)
      
      // Add achievement types table
      doc.setFontSize(14)
      doc.text('Prestasi per Jenis', 14, 90)
      
      const jenisData = laporanStats.prestasiPerJenis.map(item => [
        item.jenis,
        item.count.toString(),
        `${item.percentage}%`
      ])
      
      // Add table with error handling
      try {
        doc.autoTable({
          head: [['Jenis Prestasi', 'Jumlah', 'Persentase']],
          body: jenisData,
          startY: 100,
          theme: 'grid',
          styles: { fontSize: 10 }
        })
      } catch (tableError) {
        console.error('Error creating first table:', tableError)
        // Fallback: add data as text
        doc.setFontSize(10)
        let yPos = 100
        jenisData.forEach(row => {
          doc.text(`${row[0]}: ${row[1]} (${row[2]})`, 14, yPos)
          yPos += 7
        })
      }
      
      // Get the Y position after the first table
      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 140
      
      // Add top students table
      doc.setFontSize(14)
      doc.text('Top 10 Siswa Berprestasi', 14, finalY)
      
      const siswaData = laporanStats.topSiswa.map((siswa, index) => [
        `${index + 1}`,
        siswa.nama,
        siswa.kelas,
        siswa.count.toString()
      ])
      
      // Add second table with error handling
      try {
        doc.autoTable({
          head: [['No', 'Nama Siswa', 'Kelas', 'Jumlah Prestasi']],
          body: siswaData,
          startY: finalY + 10,
          theme: 'grid',
          styles: { fontSize: 10 }
        })
      } catch (tableError) {
        console.error('Error creating second table:', tableError)
        // Fallback: add data as text
        doc.setFontSize(10)
        let yPos = finalY + 10
        siswaData.forEach(row => {
          doc.text(`${row[0]}. ${row[1]} (${row[2]}) - ${row[3]} prestasi`, 14, yPos)
          yPos += 7
        })
      }
      
      // Save the PDF
      doc.save(`laporan-prestasi-${new Date().toISOString().split('T')[0]}.pdf`)
      
      toast({
        title: "Berhasil",
        description: "Laporan PDF berhasil diunduh",
      })
    } catch (error) {
      console.error('Error exporting PDF:', error)
      toast({
        title: "Error",
        description: "Gagal mengekspor PDF. Silakan coba lagi.",
        variant: "destructive",
      })
    }
  }

  const exportToExcel = () => {
    try {
      // Create workbook
      const wb = XLSX.utils.book_new()
      
      // Create statistics sheet
      const statsData = [
        ['LAPORAN PRESTASI SISWA'],
        ['Tanggal', new Date().toLocaleDateString('id-ID')],
        [],
        ['STATISTIK UMUM'],
        ['Total Siswa', stats.totalSiswa],
        ['Total Guru', stats.totalGuru],
        ['Total Prestasi', stats.totalPrestasi],
        ['Prestasi Bulan Ini', stats.prestasiBulanIni],
        [],
        ['PRESTASI PER JENIS'],
        ['Jenis Prestasi', 'Jumlah', 'Persentase'],
        ...laporanStats.prestasiPerJenis.map(item => [
          item.jenis,
          item.count,
          `${item.percentage}%`
        ]),
        [],
        ['PRESTASI PER TINGKAT'],
        ['Tingkat', 'Jumlah', 'Persentase'],
        ...laporanStats.prestasiPerTingkat.map(item => [
          item.tingkat,
          item.count,
          `${item.percentage}%`
        ]),
        [],
        ['TOP 5 GURU'],
        ['Nama Guru', 'Email', 'Total Prestasi'],
        ...laporanStats.topGuru.map(guru => [
          guru.name,
          guru.email,
          guru.totalPrestasi
        ]),
        [],
        ['TOP 10 SISWA'],
        ['Nama Siswa', 'Kelas', 'Jumlah Prestasi'],
        ...laporanStats.topSiswa.map(siswa => [
          siswa.nama,
          siswa.kelas,
          siswa.count
        ]),
        [],
        ['PRESTASI PER BULAN'],
        ['Bulan', 'Jumlah'],
        ...laporanStats.prestasiPerBulan.map(item => [
          item.month,
          item.count
        ])
      ]
      
      const statsWs = XLSX.utils.aoa_to_sheet(statsData)
      XLSX.utils.book_append_sheet(wb, statsWs, 'Statistik')
      
      // Create detailed achievements sheet
      const prestasiData = [
        ['DATA PRESTASI DETAIL'],
        [],
        ['Nama Siswa', 'Kelas', 'Nama Prestasi', 'Jenis', 'Tingkat', 'Tanggal', 'Guru']
      ]
      
      prestasiList.forEach(prestasi => {
        prestasiData.push([
          prestasi.siswa.nama,
          prestasi.siswa.kelas,
          prestasi.namaPrestasi,
          formatJenisPrestasi(prestasi.jenisPrestasi),
          formatTingkat(prestasi.tingkat),
          new Date(prestasi.tanggal).toLocaleDateString('id-ID'),
          prestasi.guru.name
        ])
      })
      
      const prestasiWs = XLSX.utils.aoa_to_sheet(prestasiData)
      XLSX.utils.book_append_sheet(wb, prestasiWs, 'Data Prestasi')
      
      // Save the Excel file
      XLSX.writeFile(wb, `laporan-prestasi-${new Date().toISOString().split('T')[0]}.xlsx`)
      
      toast({
        title: "Berhasil",
        description: "Laporan Excel berhasil diunduh",
      })
    } catch (error) {
      console.error('Error exporting Excel:', error)
      toast({
        title: "Error",
        description: "Gagal mengekspor Excel",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    )
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
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                  SIPRISTA
                </h1>
                <p className="text-sm text-gray-600">Dashboard Administrator</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-slate-100 text-slate-800">
                <UserCheck className="w-3 h-3 mr-1" />
                {user?.name}
              </Badge>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Keluar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Siswa</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalSiswa}</div>
              <p className="text-xs text-muted-foreground">
                Siswa terdaftar
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Guru</CardTitle>
              <UserCheck className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.totalGuru}</div>
              <p className="text-xs text-muted-foreground">
                Guru aktif
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Prestasi</CardTitle>
              <Trophy className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.totalPrestasi}</div>
              <p className="text-xs text-muted-foreground">
                Prestasi tercatat
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prestasi Bulan Ini</CardTitle>
              <Activity className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.prestasiBulanIni}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3 inline mr-1" />
                +20% dari bulan lalu
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="siswa" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="siswa">Data Siswa</TabsTrigger>
            <TabsTrigger value="guru">Data Guru</TabsTrigger>
            <TabsTrigger value="prestasi">Data Prestasi</TabsTrigger>
            <TabsTrigger value="laporan">Laporan</TabsTrigger>
          </TabsList>

          <TabsContent value="siswa" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Data Siswa
                    </CardTitle>
                    <CardDescription>
                      Kelola data siswa terdaftar di sistem
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Cari siswa..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 w-64"
                      />
                    </div>
                    <Dialog open={showSiswaForm} onOpenChange={setShowSiswaForm}>
                      <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-slate-600 to-slate-700">
                          <Plus className="w-4 h-4 mr-2" />
                          Tambah Siswa
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Tambah Siswa Baru</DialogTitle>
                          <DialogDescription>
                            Isi data siswa yang akan ditambahkan
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddSiswa} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="nis">NIS</Label>
                              <Input
                                id="nis"
                                value={siswaForm.nis}
                                onChange={(e) => setSiswaForm(prev => ({ ...prev, nis: e.target.value }))}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="jenisKelamin">Jenis Kelamin</Label>
                              <Select value={siswaForm.jenisKelamin} onValueChange={(value) => setSiswaForm(prev => ({ ...prev, jenisKelamin: value }))}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="LAKI_LAKI">Laki-laki</SelectItem>
                                  <SelectItem value="PEREMPUAN">Perempuan</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="nama">Nama Lengkap</Label>
                            <Input
                              id="nama"
                              value={siswaForm.nama}
                              onChange={(e) => setSiswaForm(prev => ({ ...prev, nama: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="kelas">Kelas</Label>
                              <Input
                                id="kelas"
                                value={siswaForm.kelas}
                                onChange={(e) => setSiswaForm(prev => ({ ...prev, kelas: e.target.value }))}
                                required
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="tanggalLahir">Tanggal Lahir</Label>
                            <Input
                              id="tanggalLahir"
                              type="date"
                              value={siswaForm.tanggalLahir}
                              onChange={(e) => setSiswaForm(prev => ({ ...prev, tanggalLahir: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="alamat">Alamat</Label>
                            <Input
                              id="alamat"
                              value={siswaForm.alamat}
                              onChange={(e) => setSiswaForm(prev => ({ ...prev, alamat: e.target.value }))}
                            />
                          </div>
                          <div className="flex space-x-2">
                            <Button type="submit" className="bg-gradient-to-r from-blue-500 to-yellow-500">
                              Simpan
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setShowSiswaForm(false)}>
                              Batal
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NIS</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSiswa.map((siswa) => (
                      <TableRow key={siswa.id}>
                        <TableCell className="font-medium">{siswa.nis}</TableCell>
                        <TableCell>{siswa.nama}</TableCell>
                        <TableCell>{siswa.kelas}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteSiswa(siswa.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guru" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5" />
                      Data Guru
                    </CardTitle>
                    <CardDescription>
                      Kelola data guru di sistem
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Cari guru..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 w-64"
                      />
                    </div>
                    <Dialog open={showGuruForm} onOpenChange={setShowGuruForm}>
                      <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-slate-600 to-slate-700">
                          <Plus className="w-4 h-4 mr-2" />
                          Tambah Guru
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Tambah Guru Baru</DialogTitle>
                          <DialogDescription>
                            Isi data guru yang akan ditambahkan
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddGuru} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              value={guruForm.email}
                              onChange={(e) => setGuruForm(prev => ({ ...prev, email: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="name">Nama Lengkap</Label>
                            <Input
                              id="name"
                              value={guruForm.name}
                              onChange={(e) => setGuruForm(prev => ({ ...prev, name: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                              id="password"
                              type="password"
                              value={guruForm.password}
                              onChange={(e) => setGuruForm(prev => ({ ...prev, password: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="nip">NIP (Opsional)</Label>
                            <Input
                              id="nip"
                              value={guruForm.nip}
                              onChange={(e) => setGuruForm(prev => ({ ...prev, nip: e.target.value }))}
                            />
                          </div>
                          <div className="flex space-x-2">
                            <Button type="submit" className="bg-gradient-to-r from-blue-500 to-yellow-500">
                              Simpan
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setShowGuruForm(false)}>
                              Batal
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>NIP</TableHead>
                      <TableHead>Prestasi</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGuru.map((guru) => (
                      <TableRow key={guru.id}>
                        <TableCell className="font-medium">{guru.name}</TableCell>
                        <TableCell>{guru.email}</TableCell>
                        <TableCell>{guru.nip || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {guru._count.prestasiCreated} prestasi
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteGuru(guru.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prestasi" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Data Prestasi
                    </CardTitle>
                    <CardDescription>
                      Kelola data prestasi siswa
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Cari prestasi..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 w-64"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Siswa</TableHead>
                      <TableHead>Nama Prestasi</TableHead>
                      <TableHead>Jenis</TableHead>
                      <TableHead>Tingkat</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Guru</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPrestasi.map((prestasi) => (
                      <TableRow key={prestasi.id}>
                        <TableCell className="font-medium">
                          {prestasi.siswa.nama}
                          <div className="text-sm text-gray-500">{prestasi.siswa.kelas}</div>
                        </TableCell>
                        <TableCell>{prestasi.namaPrestasi}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{formatJenisPrestasi(prestasi.jenisPrestasi)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{formatTingkat(prestasi.tingkat)}</Badge>
                        </TableCell>
                        <TableCell>{new Date(prestasi.tanggal).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell>{prestasi.guru.name}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeletePrestasi(prestasi.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="laporan" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Statistik Jenis Prestasi */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Distribusi Jenis Prestasi
                  </CardTitle>
                  <CardDescription>
                    Persentase prestasi berdasarkan kategori
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {laporanStats.prestasiPerJenis.map((item) => (
                      <div key={item.jenis} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{item.jenis}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{item.count} prestasi</span>
                            <span className="text-sm font-bold">{item.percentage}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-slate-500 to-slate-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Statistik Tingkat Prestasi */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Distribusi Tingkat Prestasi
                  </CardTitle>
                  <CardDescription>
                    Persentase prestasi berdasarkan tingkat
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {laporanStats.prestasiPerTingkat.map((item) => (
                      <div key={item.tingkat} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{item.tingkat}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{item.count} prestasi</span>
                            <span className="text-sm font-bold">{item.percentage}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Top Guru */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5" />
                    Top 5 Guru Teraktif
                  </CardTitle>
                  <CardDescription>
                    Guru dengan input prestasi terbanyak
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {laporanStats.topGuru.map((guru, index) => (
                      <div key={guru.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                            index === 0 ? 'bg-yellow-500' :
                            index === 1 ? 'bg-gray-400' :
                            index === 2 ? 'bg-orange-600' :
                            'bg-slate-500'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{guru.name}</p>
                            <p className="text-sm text-muted-foreground">{guru.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{guru.totalPrestasi}</p>
                          <p className="text-sm text-muted-foreground">prestasi</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Siswa */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Top 10 Siswa Berprestasi
                  </CardTitle>
                  <CardDescription>
                    Siswa dengan jumlah prestasi terbanyak
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {laporanStats.topSiswa.map((siswa, index) => (
                      <div key={siswa.nama} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                            index === 0 ? 'bg-yellow-500' :
                            index === 1 ? 'bg-gray-400' :
                            index === 2 ? 'bg-orange-600' :
                            'bg-slate-500'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{siswa.nama}</p>
                            <p className="text-sm text-muted-foreground">{siswa.kelas}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{siswa.count}</p>
                          <p className="text-sm text-muted-foreground">prestasi</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Grafik Prestasi per Bulan */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Prestasi per Bulan ({new Date().getFullYear()})
                </CardTitle>
                <CardDescription>
                  Jumlah prestasi yang dicapai setiap bulan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {laporanStats.prestasiPerBulan.map((item) => (
                      <div key={item.month} className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-2">{item.month}</p>
                        <p className="text-2xl font-bold text-blue-600">{item.count}</p>
                        <p className="text-xs text-muted-foreground">prestasi</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export Options */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Export Laporan</CardTitle>
                <CardDescription>
                  Unduh laporan dalam berbagai format
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Button 
                    className="bg-gradient-to-r from-blue-500 to-yellow-500"
                    onClick={exportToPDF}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={exportToExcel}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Excel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}