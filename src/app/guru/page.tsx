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
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { 
  Trophy, 
  LogOut, 
  Plus, 
  Edit, 
  Eye,
  School,
  Award,
  TrendingUp,
  Users,
  Search,
  Calendar,
  Trash2,
  Download
} from 'lucide-react'

interface PrestasiItem {
  id: string
  siswaId: string
  siswa: { nama: string; kelas: string; jurusan?: string }
  namaPrestasi: string
  tingkat: string
  tanggal: string
  jenisPrestasi: string
  penyelenggara?: string
  deskripsi?: string
  guruId: string
  guru?: { name: string; email: string }
}

export default function GuruDashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPrestasi, setEditingPrestasi] = useState<PrestasiItem | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [prestasiList, setPrestasiList] = useState<PrestasiItem[]>([])
  const [siswaList, setSiswaList] = useState<{id: string, nama: string, kelas: string}[]>([])
  const [formData, setFormData] = useState({
    siswaId: '',
    namaPrestasi: '',
    jenisPrestasi: '',
    tingkat: '',
    penyelenggara: '',
    tanggal: '',
    deskripsi: ''
  })
  const [editFormData, setEditFormData] = useState({
    siswaId: '',
    namaPrestasi: '',
    jenisPrestasi: '',
    tingkat: '',
    penyelenggara: '',
    tanggal: '',
    deskripsi: ''
  })

  // Hitung statistik dinamis dari data prestasi
  const stats = {
    totalPrestasi: prestasiList.length,
    prestasiBulanIni: prestasiList.filter(p => {
      const prestasiDate = new Date(p.tanggal)
      const now = new Date()
      return prestasiDate.getMonth() === now.getMonth() && 
             prestasiDate.getFullYear() === now.getFullYear()
    }).length,
    siswaBerprestasi: new Set(prestasiList.map(p => p.siswaId)).size,
    rataPrestasi: prestasiList.length > 0 ? 
      (prestasiList.length / new Set(prestasiList.map(p => p.siswaId)).size).toFixed(1) : '0'
  }

  // Statistik dinamis per jenis prestasi
  const statsPerJenis = {
    AKADEMIK: prestasiList.filter(p => p.jenisPrestasi === 'AKADEMIK').length,
    NON_AKADEMIK: prestasiList.filter(p => p.jenisPrestasi === 'NON_AKADEMIK').length,
    EKSTRAKURIKULER: prestasiList.filter(p => p.jenisPrestasi === 'EKSTRAKURIKULER').length,
    LAINNYA: prestasiList.filter(p => p.jenisPrestasi === 'LAINNYA').length,
  }

  // Statistik dinamis per bulan
  const statsPerBulan = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    const count = prestasiList.filter(p => {
      const prestasiDate = new Date(p.tanggal)
      return prestasiDate.getMonth() === i && prestasiDate.getFullYear() === new Date().getFullYear()
    }).length
    return { month, count }
  })

  // Top 5 siswa berprestasi
  const topSiswa = Object.entries(
    prestasiList.reduce((acc, prestasi) => {
      acc[prestasi.siswaId] = (acc[prestasi.siswaId] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  )
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([siswaId, count]) => {
      const siswa = prestasiList.find(p => p.siswaId === siswaId)?.siswa
      return {
        nama: siswa?.nama || 'Unknown',
        kelas: siswa?.kelas || '',
        count
      }
    })

  // Helper functions
  const getMonthName = (month: number) => {
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
    return months[month - 1]
  }

  const getJenisPrestasiPercentage = (jenis: string) => {
    const total = prestasiList.length
    if (total === 0) return 0
    return Math.round((statsPerJenis[jenis as keyof typeof statsPerJenis] / total) * 100)
  }

  const mockPrestasi: PrestasiItem[] = [
    { id: '1', siswaId: '1', siswa: { nama: 'Ahmad Rizki', kelas: 'XII IPA 1' }, namaPrestasi: 'Juara 1 Olimpiade Matematika', tingkat: 'PROVINSI', tanggal: '2024-01-15', jenisPrestasi: 'AKADEMIK', guruId: user?.id || '' },
    { id: '2', siswaId: '2', siswa: { nama: 'Siti Nurhaliza', kelas: 'XII IPS 2' }, namaPrestasi: 'Best Speaker English Debate', tingkat: 'NASIONAL', tanggal: '2024-01-20', jenisPrestasi: 'AKADEMIK', guruId: user?.id || '' },
    { id: '3', siswaId: '3', siswa: { nama: 'Budi Santoso', kelas: 'XI IPA 3' }, namaPrestasi: 'Juara 2 Lomba Pidato', tingkat: 'KABUPATEN', tanggal: '2024-01-25', jenisPrestasi: 'NON_AKADEMIK', guruId: user?.id || '' },
    { id: '4', siswaId: '4', siswa: { nama: 'Dewi Lestari', kelas: 'XII IPA 2' }, namaPrestasi: 'Juara 3 Science Fair', tingkat: 'PROVINSI', tanggal: '2024-01-28', jenisPrestasi: 'AKADEMIK', guruId: user?.id || '' },
  ]

  const mockSiswa = [
    { id: '1', nama: 'Ahmad Rizki', kelas: 'XII IPA 1' },
    { id: '2', nama: 'Siti Nurhaliza', kelas: 'XII IPS 2' },
    { id: '3', nama: 'Budi Santoso', kelas: 'XI IPA 3' },
    { id: '4', nama: 'Dewi Lestari', kelas: 'XII IPA 2' },
    { id: '5', nama: 'Eko Prasetyo', kelas: 'XI IPS 1' },
  ]

  const fetchDashboardData = async () => {
    try {
      // Fetch prestasi data for current teacher only
      const prestasiRes = await fetch(`/api/prestasi?guruId=${user?.id}`)
      const prestasiData = await prestasiRes.json()
      
      // Fetch siswa data for dropdown
      const siswaRes = await fetch('/api/siswa')
      const siswaData = await siswaRes.json()
      
      setPrestasiList(prestasiData.data || [])
      setSiswaList(siswaData.data || [])
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

  useEffect(() => {
    if (!user || user.role !== 'GURU') {
      router.push('/')
      return
    }
    
    fetchDashboardData()
  }, [user, router])

  const handleLogout = () => {
    logout()
    router.push('/')
    toast({
      title: "Berhasil",
      description: "Anda telah keluar dari sistem",
    })
  }

  const handleSubmitPrestasi = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.siswaId || !formData.namaPrestasi || !formData.jenisPrestasi || !formData.tingkat || !formData.tanggal) {
      toast({
        title: "Error",
        description: "Field yang bertanda * harus diisi",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch('/api/prestasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          guruId: user?.id
        })
      })

      if (response.ok) {
        toast({
          title: "Berhasil",
          description: "Prestasi siswa berhasil ditambahkan",
        })
        setShowAddForm(false)
        setFormData({
          siswaId: '',
          namaPrestasi: '',
          jenisPrestasi: '',
          tingkat: '',
          penyelenggara: '',
          tanggal: '',
          deskripsi: ''
        })
        fetchDashboardData()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Gagal menambah prestasi",
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

  const handleEditPrestasi = (prestasi: PrestasiItem) => {
    setEditingPrestasi(prestasi)
    setEditFormData({
      siswaId: prestasi.siswaId,
      namaPrestasi: prestasi.namaPrestasi,
      jenisPrestasi: prestasi.jenisPrestasi,
      tingkat: prestasi.tingkat,
      penyelenggara: prestasi.penyelenggara || '',
      tanggal: prestasi.tanggal.split('T')[0], // Format YYYY-MM-DD
      deskripsi: prestasi.deskripsi || ''
    })
    setShowEditModal(true)
  }

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingPrestasi) return

    if (!editFormData.siswaId || !editFormData.namaPrestasi || !editFormData.jenisPrestasi || !editFormData.tingkat || !editFormData.tanggal) {
      toast({
        title: "Error",
        description: "Field yang bertanda * harus diisi",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/prestasi/${editingPrestasi.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editFormData,
          guruId: user?.id
        })
      })

      if (response.ok) {
        toast({
          title: "Berhasil",
          description: "Prestasi siswa berhasil diperbarui",
        })
        setShowEditModal(false)
        setEditingPrestasi(null)
        fetchDashboardData()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Gagal memperbarui prestasi",
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

  // Export Functions for Teacher
  const exportTeacherToPDF = () => {
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
      doc.text('Laporan Prestasi Saya', 14, 20)
      doc.setFontSize(12)
      doc.text(`Guru: ${user?.name}`, 14, 30)
      doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 37)
      
      // Add statistics
      doc.setFontSize(14)
      doc.text('Statistik Prestasi', 14, 50)
      doc.setFontSize(11)
      doc.text(`Total Prestasi: ${stats.totalPrestasi}`, 14, 60)
      doc.text(`Prestasi Bulan Ini: ${stats.prestasiBulanIni}`, 14, 67)
      doc.text(`Siswa Berprestasi: ${stats.siswaBerprestasi}`, 14, 74)
      doc.text(`Rata-rata Prestasi/Siswa: ${stats.rataPrestasi}`, 14, 81)
      
      // Add achievement types table
      doc.setFontSize(14)
      doc.text('Prestasi per Jenis', 14, 95)
      
      const jenisData = Object.entries(statsPerJenis).map(([jenis, count]) => [
        formatJenisPrestasi(jenis),
        count.toString(),
        `${getJenisPrestasiPercentage(jenis)}%`
      ])
      
      // Add table with error handling
      try {
        doc.autoTable({
          head: [['Jenis Prestasi', 'Jumlah', 'Persentase']],
          body: jenisData,
          startY: 105,
          theme: 'grid',
          styles: { fontSize: 10 }
        })
      } catch (tableError) {
        console.error('Error creating first table:', tableError)
        // Fallback: add data as text
        doc.setFontSize(10)
        let yPos = 105
        jenisData.forEach(row => {
          doc.text(`${row[0]}: ${row[1]} (${row[2]})`, 14, yPos)
          yPos += 7
        })
      }
      
      // Get the Y position after the first table
      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 145
      
      // Add top students table
      doc.setFontSize(14)
      doc.text('Top 5 Siswa Berprestasi', 14, finalY)
      
      const siswaData = topSiswa.map((siswa, index) => [
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
      doc.save(`laporan-prestasi-${user?.name}-${new Date().toISOString().split('T')[0]}.pdf`)
      
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

  const exportTeacherToExcel = () => {
    try {
      // Create workbook
      const wb = XLSX.utils.book_new()
      
      // Create statistics sheet
      const statsData = [
        ['LAPORAN PRESTASI GURU'],
        ['Nama Guru', user?.name],
        ['Email', user?.email],
        ['Tanggal', new Date().toLocaleDateString('id-ID')],
        [],
        ['STATISTIK PRESTASI'],
        ['Total Prestasi', stats.totalPrestasi],
        ['Prestasi Bulan Ini', stats.prestasiBulanIni],
        ['Siswa Berprestasi', stats.siswaBerprestasi],
        ['Rata-rata Prestasi/Siswa', stats.rataPrestasi],
        [],
        ['PRESTASI PER JENIS'],
        ['Jenis Prestasi', 'Jumlah', 'Persentase'],
        ...Object.entries(statsPerJenis).map(([jenis, count]) => [
          formatJenisPrestasi(jenis),
          count,
          `${getJenisPrestasiPercentage(jenis)}%`
        ]),
        [],
        ['PRESTASI PER BULAN'],
        ['Bulan', 'Jumlah'],
        ...statsPerBulan.map(item => [
          getMonthName(item.month),
          item.count
        ]),
        [],
        ['TOP 5 SISWA BERPRESTASI'],
        ['Nama Siswa', 'Kelas', 'Jumlah Prestasi'],
        ...topSiswa.map(siswa => [
          siswa.nama,
          siswa.kelas,
          siswa.count
        ])
      ]
      
      const statsWs = XLSX.utils.aoa_to_sheet(statsData)
      XLSX.utils.book_append_sheet(wb, statsWs, 'Statistik')
      
      // Create detailed achievements sheet
      const prestasiData = [
        ['DATA PRESTASI DETAIL'],
        [],
        ['Nama Siswa', 'Kelas', 'Nama Prestasi', 'Jenis', 'Tingkat', 'Tanggal', 'Penyelenggara']
      ]
      
      prestasiList.forEach(prestasi => {
        prestasiData.push([
          prestasi.siswa.nama,
          prestasi.siswa.kelas,
          prestasi.namaPrestasi,
          formatJenisPrestasi(prestasi.jenisPrestasi),
          formatTingkat(prestasi.tingkat),
          new Date(prestasi.tanggal).toLocaleDateString('id-ID'),
          prestasi.penyelenggara || '-'
        ])
      })
      
      const prestasiWs = XLSX.utils.aoa_to_sheet(prestasiData)
      XLSX.utils.book_append_sheet(wb, prestasiWs, 'Data Prestasi')
      
      // Save the Excel file
      XLSX.writeFile(wb, `laporan-prestasi-${user?.name}-${new Date().toISOString().split('T')[0]}.xlsx`)
      
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
                <p className="text-sm text-gray-600">Dashboard Guru</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-slate-100 text-slate-800">
                <Users className="w-3 h-3 mr-1" />
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
              <CardTitle className="text-sm font-medium">Total Prestasi</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.totalPrestasi}</div>
              <p className="text-xs text-muted-foreground">
                Yang saya input
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bulan Ini</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.prestasiBulanIni}</div>
              <p className="text-xs text-muted-foreground">
                Prestasi baru
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Siswa Berprestasi</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.siswaBerprestasi}</div>
              <p className="text-xs text-muted-foreground">
                Siswa unik
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rata-rata</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.rataPrestasi}</div>
              <p className="text-xs text-muted-foreground">
                Prestasi/siswa
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="prestasi" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="prestasi">Input Prestasi</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="statistik">Statistik</TabsTrigger>
          </TabsList>

          <TabsContent value="prestasi" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Input Prestasi Siswa
                    </CardTitle>
                    <CardDescription>
                      Tambahkan data prestasi siswa terbaru
                    </CardDescription>
                  </div>
                  <Button 
                    className="bg-gradient-to-r from-slate-600 to-slate-700"
                    onClick={() => setShowAddForm(!showAddForm)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {showAddForm ? 'Batal' : 'Tambah Prestasi'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showAddForm && (
                  <form onSubmit={handleSubmitPrestasi} className="space-y-4 border-t pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="siswa">Pilih Siswa</Label>
                        <Select value={formData.siswaId} onValueChange={(value) => setFormData(prev => ({ ...prev, siswaId: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih siswa" />
                          </SelectTrigger>
                          <SelectContent>
                            {siswaList.map((siswa) => (
                              <SelectItem key={siswa.id} value={siswa.id}>
                                {siswa.nama} - {siswa.kelas}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="namaPrestasi">Nama Prestasi</Label>
                        <Input
                          id="namaPrestasi"
                          value={formData.namaPrestasi}
                          onChange={(e) => setFormData(prev => ({ ...prev, namaPrestasi: e.target.value }))}
                          placeholder="Contoh: Juara 1 Olimpiade Matematika"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="jenisPrestasi">Jenis Prestasi</Label>
                        <Select value={formData.jenisPrestasi} onValueChange={(value) => setFormData(prev => ({ ...prev, jenisPrestasi: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih jenis" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AKADEMIK">Akademik</SelectItem>
                            <SelectItem value="NON_AKADEMIK">Non-Akademik</SelectItem>
                            <SelectItem value="EKSTRAKURIKULER">Ekstrakurikuler</SelectItem>
                            <SelectItem value="LAINNYA">Lainnya</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tingkat">Tingkat</Label>
                        <Select value={formData.tingkat} onValueChange={(value) => setFormData(prev => ({ ...prev, tingkat: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih tingkat" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SEKOLAH">Sekolah</SelectItem>
                            <SelectItem value="KECAMATAN">Kecamatan</SelectItem>
                            <SelectItem value="KABUPATEN">Kabupaten</SelectItem>
                            <SelectItem value="PROVINSI">Provinsi</SelectItem>
                            <SelectItem value="NASIONAL">Nasional</SelectItem>
                            <SelectItem value="INTERNASIONAL">Internasional</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="penyelenggara">Penyelenggara</Label>
                        <Input
                          id="penyelenggara"
                          value={formData.penyelenggara}
                          onChange={(e) => setFormData(prev => ({ ...prev, penyelenggara: e.target.value }))}
                          placeholder="Nama penyelenggara"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tanggal">Tanggal</Label>
                        <Input
                          id="tanggal"
                          type="date"
                          value={formData.tanggal}
                          onChange={(e) => setFormData(prev => ({ ...prev, tanggal: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deskripsi">Deskripsi</Label>
                      <Textarea
                        id="deskripsi"
                        value={formData.deskripsi}
                        onChange={(e) => setFormData(prev => ({ ...prev, deskripsi: e.target.value }))}
                        placeholder="Deskripsi singkat tentang prestasi"
                        rows={3}
                      />
                    </div>
                    <div className="flex space-x-4">
                      <Button type="submit" className="bg-gradient-to-r from-blue-500 to-yellow-500">
                        Simpan Prestasi
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                        Batal
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Monitoring Prestasi
                    </CardTitle>
                    <CardDescription>
                      Pantau prestasi siswa yang telah diinput
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Cari siswa atau prestasi..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 w-64"
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={exportTeacherToPDF}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={exportTeacherToExcel}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Excel
                    </Button>
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
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPrestasi.map((prestasi) => (
                      <TableRow key={prestasi.id}>
                        <TableCell className="font-medium">{prestasi.siswa.nama}</TableCell>
                        <TableCell>{prestasi.namaPrestasi}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{formatJenisPrestasi(prestasi.jenisPrestasi)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{formatTingkat(prestasi.tingkat)}</Badge>
                        </TableCell>
                        <TableCell>{new Date(prestasi.tanggal).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditPrestasi(prestasi)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeletePrestasi(prestasi.id)}
                              className="text-red-600 hover:text-red-700"
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

          <TabsContent value="statistik" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Statistik Prestasi Saya
                </CardTitle>
                <CardDescription>
                  Ringkasan prestasi yang telah saya input
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-slate-50 rounded-lg">
                    <h3 className="font-semibold text-slate-900 mb-4">Prestasi per Jenis</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Akademik</span>
                          <span className="text-sm font-medium">{statsPerJenis.AKADEMIK}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className="bg-slate-600 h-2 rounded-full transition-all duration-300" style={{ width: `${getJenisPrestasiPercentage('AKADEMIK')}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Non-Akademik</span>
                          <span className="text-sm font-medium">{statsPerJenis.NON_AKADEMIK}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className="bg-slate-600 h-2 rounded-full transition-all duration-300" style={{ width: `${getJenisPrestasiPercentage('NON_AKADEMIK')}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Ekstrakurikuler</span>
                          <span className="text-sm font-medium">{statsPerJenis.EKSTRAKURIKULER}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className="bg-slate-600 h-2 rounded-full transition-all duration-300" style={{ width: `${getJenisPrestasiPercentage('EKSTRAKURIKULER')}%` }}></div>
                        </div>
                      </div>
                      {statsPerJenis.LAINNYA > 0 && (
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm">Lainnya</span>
                            <span className="text-sm font-medium">{statsPerJenis.LAINNYA}</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div className="bg-slate-600 h-2 rounded-full transition-all duration-300" style={{ width: `${getJenisPrestasiPercentage('LAINNYA')}%` }}></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-6 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-4">Prestasi per Bulan</h3>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {statsPerBulan.map(({ month, count }) => (
                        <div key={month} className="flex justify-between">
                          <span className="text-sm">{getMonthName(month)}</span>
                          <span className="text-sm font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-6 p-6 bg-slate-50 rounded-lg">
                  <h3 className="font-semibold text-slate-900 mb-2">Top 5 Siswa Berprestasi</h3>
                  <div className="space-y-2">
                    {topSiswa.length > 0 ? (
                      topSiswa.map((siswa, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm">
                            {index + 1}. {siswa.nama} {siswa.kelas && `(${siswa.kelas})`}
                          </span>
                          <Badge variant="secondary">{siswa.count} prestasi</Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">Belum ada data prestasi</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit Prestasi Siswa
            </DialogTitle>
            <DialogDescription>
              Perbarui data prestasi siswa yang sudah ada
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitEdit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-siswa">Pilih Siswa</Label>
                <Select 
                  value={editFormData.siswaId} 
                  onValueChange={(value) => setEditFormData(prev => ({ ...prev, siswaId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih siswa" />
                  </SelectTrigger>
                  <SelectContent>
                    {siswaList.map((siswa) => (
                      <SelectItem key={siswa.id} value={siswa.id}>
                        {siswa.nama} - {siswa.kelas}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-namaPrestasi">Nama Prestasi</Label>
                <Input
                  id="edit-namaPrestasi"
                  value={editFormData.namaPrestasi}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, namaPrestasi: e.target.value }))}
                  placeholder="Contoh: Juara 1 Olimpiade Matematika"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-jenisPrestasi">Jenis Prestasi</Label>
                <Select 
                  value={editFormData.jenisPrestasi} 
                  onValueChange={(value) => setEditFormData(prev => ({ ...prev, jenisPrestasi: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AKADEMIK">Akademik</SelectItem>
                    <SelectItem value="NON_AKADEMIK">Non-Akademik</SelectItem>
                    <SelectItem value="EKSTRAKURIKULER">Ekstrakurikuler</SelectItem>
                    <SelectItem value="LAINNYA">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tingkat">Tingkat</Label>
                <Select 
                  value={editFormData.tingkat} 
                  onValueChange={(value) => setEditFormData(prev => ({ ...prev, tingkat: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tingkat" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEKOLAH">Sekolah</SelectItem>
                    <SelectItem value="KECAMATAN">Kecamatan</SelectItem>
                    <SelectItem value="KABUPATEN">Kabupaten</SelectItem>
                    <SelectItem value="PROVINSI">Provinsi</SelectItem>
                    <SelectItem value="NASIONAL">Nasional</SelectItem>
                    <SelectItem value="INTERNASIONAL">Internasional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-penyelenggara">Penyelenggara</Label>
                <Input
                  id="edit-penyelenggara"
                  value={editFormData.penyelenggara}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, penyelenggara: e.target.value }))}
                  placeholder="Nama penyelenggara"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tanggal">Tanggal</Label>
                <Input
                  id="edit-tanggal"
                  type="date"
                  value={editFormData.tanggal}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, tanggal: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-deskripsi">Deskripsi</Label>
                <Textarea
                  id="edit-deskripsi"
                  value={editFormData.deskripsi}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, deskripsi: e.target.value }))}
                  placeholder="Deskripsi prestasi (opsional)"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowEditModal(false)}
              >
                Batal
              </Button>
              <Button 
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-yellow-500"
              >
                <Edit className="w-4 h-4 mr-2" />
                Update Prestasi
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}