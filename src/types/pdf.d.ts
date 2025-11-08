// Type definitions for jsPDF autoTable plugin
declare module 'jspdf' {
  interface jsPDF {
    autoTable(options: AutoTableOptions): void
    lastAutoTable?: {
      finalY: number
    }
  }

  interface AutoTableOptions {
    head: string[][]
    body: string[][]
    startY: number
    theme?: 'grid' | 'plain' | 'striped'
    styles?: {
      fontSize?: number
      font?: string
      cellPadding?: number
    }
    headStyles?: {
      fillColor?: [number, number, number]
      textColor?: number
      fontStyle?: 'normal' | 'bold' | 'italic'
    }
    bodyStyles?: {
      fillColor?: [number, number, number]
      textColor?: number
      fontStyle?: 'normal' | 'bold' | 'italic'
    }
    alternateRowStyles?: {
      fillColor?: [number, number, number]
      textColor?: number
      fontStyle?: 'normal' | 'bold' | 'italic'
    }
  }
}