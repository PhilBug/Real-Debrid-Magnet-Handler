import React, { useState, useEffect, useCallback } from 'react'
import browser from 'webextension-polyfill'
import { storage } from '../utils/storage'
import {
  requestNotificationPermission,
  isNotificationPermissionGranted,
} from '../utils/notifications'
import type { DashboardSettings } from '../utils/types'
import { Button } from '../components/common/Button'
import { Icon } from '../components/common/Icon'

interface NotificationManagerProps {
  className?: string
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({ className = '' }) => {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [dashboardSettings, setDashboardSettings] = useState<DashboardSettings | null>(null)
  const [showPermissionRequest, setShowPermissionRequest] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)

  // Check notification permission status
  useEffect(() => {
    const checkPermission = () => {
      setPermission(Notification.permission)
    }

    checkPermission()

    // Listen for storage changes
    const handleStorageChange = (
      changes: { [key: string]: { newValue?: unknown } },
      areaName: string
    ) => {
      if (areaName === 'sync' && changes.dashboardSettings) {
        setDashboardSettings(changes.dashboardSettings.newValue as DashboardSettings)
      }
    }

    browser.storage.onChanged.addListener(handleStorageChange)

    return () => {
      browser.storage.onChanged.removeListener(handleStorageChange)
    }
  }, [])

  // Load dashboard settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await storage.getDashboardSettings()
        setDashboardSettings(settings)

        // Show permission request if notifications are enabled but not granted
        if (settings.notificationsEnabled && !isNotificationPermissionGranted()) {
          setShowPermissionRequest(true)
        }
      } catch (error) {
        console.error('Failed to load dashboard settings:', error)
      }
    }

    loadSettings()
  }, [permission])

  // Request notification permission
  const handleRequestPermission = useCallback(async () => {
    setIsRequesting(true)
    try {
      const granted = await requestNotificationPermission()
      setPermission(granted ? 'granted' : 'denied')

      if (!granted) {
        // If permission denied, disable notifications in settings
        if (dashboardSettings) {
          await storage.saveDashboardSettings({ notificationsEnabled: false })
        }
      }

      setShowPermissionRequest(false)
    } catch (error) {
      console.error('Failed to request notification permission:', error)
    } finally {
      setIsRequesting(false)
    }
  }, [dashboardSettings])

  // Toggle notifications in settings
  const handleToggleNotifications = useCallback(async () => {
    if (!dashboardSettings) return

    const newEnabled = !dashboardSettings.notificationsEnabled

    try {
      await storage.saveDashboardSettings({ notificationsEnabled: newEnabled })

      // If enabling and permission not granted, show permission request
      if (newEnabled && !isNotificationPermissionGranted()) {
        setShowPermissionRequest(true)
      }
    } catch (error) {
      console.error('Failed to toggle notifications:', error)
    }
  }, [dashboardSettings])

  // Dismiss permission request
  const handleDismissPermissionRequest = useCallback(async () => {
    setShowPermissionRequest(false)

    // Disable notifications if dismissed
    if (dashboardSettings?.notificationsEnabled) {
      try {
        await storage.saveDashboardSettings({ notificationsEnabled: false })
      } catch (error) {
        console.error('Failed to disable notifications:', error)
      }
    }
  }, [dashboardSettings])

  if (!dashboardSettings) {
    return null
  }

  return (
    <div className={`notification-manager ${className}`}>
      {/* Permission Request Banner */}
      {showPermissionRequest && permission !== 'granted' && (
        <div className="notification-permission-banner">
          <div className="notification-permission-content">
            <div className="notification-permission-icon">
              <Icon name="file" size="lg" />
            </div>
            <div className="notification-permission-text">
              <h3 className="notification-permission-title">Enable Notifications</h3>
              <p className="notification-permission-description">
                Get notified when your torrents complete or fail
              </p>
            </div>
          </div>
          <div className="notification-permission-actions">
            <Button
              variant="primary"
              size="md"
              onClick={handleRequestPermission}
              loading={isRequesting}
            >
              {isRequesting ? 'Requesting...' : 'Allow Notifications'}
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={handleDismissPermissionRequest}
              disabled={isRequesting}
            >
              Not Now
            </Button>
          </div>
        </div>
      )}

      {/* Notification Toggle */}
      <div className="notification-toggle">
        <label className="notification-toggle-label" htmlFor="notifications-toggle">
          <span className="notification-toggle-text">Notifications</span>
          <span className="notification-toggle-status">
            {permission === 'granted' ? (
              <Icon name="check-circle" size="sm" className="notification-status-icon--success" />
            ) : permission === 'denied' ? (
              <Icon name="x-circle" size="sm" className="notification-status-icon--error" />
            ) : null}
          </span>
        </label>
        <button
          type="button"
          id="notifications-toggle"
          className={`notification-toggle-switch ${
            dashboardSettings.notificationsEnabled ? 'enabled' : 'disabled'
          }`}
          onClick={handleToggleNotifications}
          aria-label={
            dashboardSettings.notificationsEnabled
              ? 'Disable notifications'
              : 'Enable notifications'
          }
          aria-pressed={dashboardSettings.notificationsEnabled}
        >
          <span className="notification-toggle-slider" />
        </button>
      </div>

      {/* Permission Status Indicator */}
      {permission === 'denied' && dashboardSettings.notificationsEnabled && (
        <div className="notification-permission-denied">
          <span className="notification-permission-denied-icon">
            <Icon name="x-circle" size="sm" />
          </span>
          <span className="notification-permission-denied-text">
            Notifications are blocked in browser settings
          </span>
        </div>
      )}
    </div>
  )
}

export default NotificationManager
