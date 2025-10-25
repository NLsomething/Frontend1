import { useState } from 'react'
import { fetchDevicesByRoomId, updateDeviceOutput } from '../services/deviceService'
import { supabase } from '../lib/supabaseClient'
import { useNotifications } from '../context/NotificationContext'

/**
 * Custom hook for managing room devices
 * @returns {object} - Device state and handlers
 */
export const useRoomDevices = () => {
  const { notifyError } = useNotifications()
  const [devices, setDevices] = useState([])
  const [devicesLoading, setDevicesLoading] = useState(false)
  const [isEditDeviceModalOpen, setIsEditDeviceModalOpen] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [editDeviceForm, setEditDeviceForm] = useState({
    device_name: '',
    device_type: '',
    status: '',
    device_output: ''
  })

  const loadDevices = async (roomId) => {
    if (!roomId) {
      setDevices([])
      return
    }

    setDevicesLoading(true)
    try {
      const { data, error } = await fetchDevicesByRoomId(roomId)
      
      if (error) {
        console.error('Error loading devices:', error)
        setDevices([])
      } else {
        setDevices(data || [])
      }
    } catch (err) {
      console.error('Error loading devices:', err)
      setDevices([])
    }
    setDevicesLoading(false)
  }

  const handleDeviceToggle = async (device) => {
    const newOutput = device.device_output === 'locked' ? 'unlocked' : 'locked'
    
    try {
      const { error } = await updateDeviceOutput(device.id, newOutput)
      
      if (error) {
        notifyError('Failed to update device', { description: error.message })
      } else {
        // Update local state
        setDevices(prev => prev.map(d => 
          d.id === device.id ? { ...d, device_output: newOutput } : d
        ))
      }
    } catch (err) {
      notifyError('Failed to update device', { description: err.message })
    }
  }

  const handleEditDevice = (device) => {
    setSelectedDevice(device)
    setEditDeviceForm({
      device_name: device.device_name,
      device_type: device.device_type,
      status: device.status,
      device_output: device.device_output
    })
    setIsEditDeviceModalOpen(true)
  }

  const handleSaveDevice = async () => {
    if (!selectedDevice) return

    try {
      // Update device in database
      const { error } = await supabase
        .from('devices')
        .update({
          device_name: editDeviceForm.device_name,
          device_type: editDeviceForm.device_type,
          status: editDeviceForm.status,
          device_output: editDeviceForm.device_output
        })
        .eq('id', selectedDevice.id)

      if (error) {
        notifyError('Failed to update device', { description: error.message })
        return
      }

      // Update local state
      setDevices(prev => prev.map(d =>
        d.id === selectedDevice.id ? { ...d, ...editDeviceForm } : d
      ))

      // Close modal
      setIsEditDeviceModalOpen(false)
      setSelectedDevice(null)
    } catch (err) {
      notifyError('Failed to update device', { description: err.message })
    }
  }

  const handleCloseDeviceModal = () => {
    setIsEditDeviceModalOpen(false)
    setSelectedDevice(null)
  }

  const clearDevices = () => {
    setDevices([])
  }

  return {
    devices,
    devicesLoading,
    isEditDeviceModalOpen,
    selectedDevice,
    editDeviceForm,
    setEditDeviceForm,
    loadDevices,
    handleDeviceToggle,
    handleEditDevice,
    handleSaveDevice,
    handleCloseDeviceModal,
    clearDevices
  }
}

