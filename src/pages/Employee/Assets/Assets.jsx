import { useState } from 'react'
import AssetList from './components/AssetList/AssetList'
import AssetFilters from './components/AssetFilters/AssetFilters'
import toast from 'react-hot-toast'
import './Assets.css'

function Assets() {
  const [filters, setFilters] = useState({
    employeeName: '',
    assetType: '',
    status: ''
  })

  const [assets, setAssets] = useState([
    {
      id: 'AST001',
      assetName: 'Laptop - MacBook Pro',
      assetType: 'Laptop',
      employeeName: 'Harry Porter',
      employeeId: 'EMP001',
      serialNumber: 'SN-MBP-2023-001',
      assignedDate: '1 March, 2023',
      status: 'Assigned',
      condition: 'Good'
    },
    {
      id: 'AST002',
      assetName: 'Monitor - Dell 27"',
      assetType: 'Monitor',
      employeeName: 'Lary go',
      employeeId: 'EMP002',
      serialNumber: 'SN-DEL-2023-002',
      assignedDate: '5 March, 2023',
      status: 'Assigned',
      condition: 'Excellent'
    },
    {
      id: 'AST003',
      assetName: 'Keyboard - Mechanical',
      assetType: 'Accessory',
      employeeName: 'Sumona Gang',
      employeeId: 'EMP003',
      serialNumber: 'SN-KBD-2023-003',
      assignedDate: '10 March, 2023',
      status: 'Assigned',
      condition: 'Good'
    },
    {
      id: 'AST004',
      assetName: 'Laptop - Dell XPS',
      assetType: 'Laptop',
      employeeName: 'David Morph',
      employeeId: 'EMP004',
      serialNumber: 'SN-DLX-2023-004',
      assignedDate: '15 March, 2023',
      status: 'Returned',
      condition: 'Good'
    },
    {
      id: 'AST005',
      assetName: 'Mouse - Wireless',
      assetType: 'Accessory',
      employeeName: 'Willium Cany',
      employeeId: 'EMP005',
      serialNumber: 'SN-MSE-2023-005',
      assignedDate: '20 March, 2023',
      status: 'Assigned',
      condition: 'Excellent'
    },
    {
      id: 'AST006',
      assetName: 'Headset - Sony WH-1000XM4',
      assetType: 'Accessory',
      employeeName: 'Keny Dinen',
      employeeId: 'EMP006',
      serialNumber: 'SN-HDS-2023-006',
      assignedDate: '25 March, 2023',
      status: 'Assigned',
      condition: 'Good'
    },
    {
      id: 'AST007',
      assetName: 'Monitor - LG 32"',
      assetType: 'Monitor',
      employeeName: 'Frintim Zomata',
      employeeId: 'EMP007',
      serialNumber: 'SN-LG-2023-007',
      assignedDate: '28 March, 2023',
      status: 'Assigned',
      condition: 'Excellent'
    }
  ])

  const handleFilterChange = (field, value) => {
    setFilters({
      ...filters,
      [field]: value
    })
  }

  const handleAssign = () => {
    toast('Assign Asset functionality - to be implemented')
  }

  const handleReturn = (id) => {
    setAssets(assets.map(asset => 
      asset.id === id 
        ? { ...asset, status: 'Returned' }
        : asset
    ))
  }

  const handleDelete = (id) => {
    setAssets(assets.filter(asset => asset.id !== id))
  }

  return (
    <div className="assets-page">
      <h1 className="page-title">Hello Thomas</h1>
      
      <div className="assets-section">
        <div className="section-header">
          <h2 className="section-heading">Assets</h2>
          <button className="btn-assign" onClick={handleAssign}>
            + Assign Asset
          </button>
        </div>

        <AssetFilters
          filters={filters}
          onFilterChange={handleFilterChange}
        />

        <AssetList
          assets={assets}
          onReturn={handleReturn}
          onDelete={handleDelete}
        />
      </div>
    </div>
  )
}

export default Assets

