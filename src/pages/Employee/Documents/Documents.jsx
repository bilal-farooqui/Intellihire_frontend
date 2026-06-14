import { useState } from 'react'
import DocumentList from './components/DocumentList/DocumentList'
import DocumentFilters from './components/DocumentFilters/DocumentFilters'
import toast from 'react-hot-toast'
import './Documents.css'

function Documents() {
  const [filters, setFilters] = useState({
    employeeName: '',
    documentType: '',
    dateRange: ''
  })

  const [documents, setDocuments] = useState([
    {
      id: 'DOC001',
      employeeName: 'Harry Porter',
      employeeId: 'EMP001',
      documentType: 'Contract',
      fileName: 'employment_contract.pdf',
      uploadDate: '15 Jan, 2023',
      status: 'Active',
      size: '2.4 MB'
    },
    {
      id: 'DOC002',
      employeeName: 'Lary go',
      employeeId: 'EMP002',
      documentType: 'ID Proof',
      fileName: 'passport_copy.pdf',
      uploadDate: '20 Jan, 2023',
      status: 'Active',
      size: '1.8 MB'
    },
    {
      id: 'DOC003',
      employeeName: 'Sumona Gang',
      employeeId: 'EMP003',
      documentType: 'Certificate',
      fileName: 'degree_certificate.pdf',
      uploadDate: '25 Jan, 2023',
      status: 'Active',
      size: '3.2 MB'
    },
    {
      id: 'DOC004',
      employeeName: 'David Morph',
      employeeId: 'EMP004',
      documentType: 'Contract',
      fileName: 'employment_contract.pdf',
      uploadDate: '10 Feb, 2023',
      status: 'Expired',
      size: '2.1 MB'
    },
    {
      id: 'DOC005',
      employeeName: 'Willium Cany',
      employeeId: 'EMP005',
      documentType: 'ID Proof',
      fileName: 'driving_license.pdf',
      uploadDate: '5 Feb, 2023',
      status: 'Active',
      size: '1.5 MB'
    },
    {
      id: 'DOC006',
      employeeName: 'Keny Dinen',
      employeeId: 'EMP006',
      documentType: 'Certificate',
      fileName: 'training_certificate.pdf',
      uploadDate: '28 Feb, 2023',
      status: 'Active',
      size: '2.9 MB'
    }
  ])

  const handleFilterChange = (field, value) => {
    setFilters({
      ...filters,
      [field]: value
    })
  }

  const handleUpload = () => {
    toast('Upload Document functionality - to be implemented')
  }

  const handleDelete = (id) => {
    setDocuments(documents.filter(doc => doc.id !== id))
  }

  const handleDownload = (document) => {
    toast.success(`Downloading ${document.fileName}`)
  }

  return (
    <div className="documents-page">
      <h1 className="page-title">Hello Thomas</h1>
      
      <div className="documents-section">
        <div className="section-header">
          <h2 className="section-heading">Documents</h2>
          <button className="btn-upload" onClick={handleUpload}>
            + Upload Document
          </button>
        </div>

        <DocumentFilters
          filters={filters}
          onFilterChange={handleFilterChange}
        />

        <DocumentList
          documents={documents}
          onDownload={handleDownload}
          onDelete={handleDelete}
        />
      </div>
    </div>
  )
}

export default Documents

