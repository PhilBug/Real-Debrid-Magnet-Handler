import browser from 'webextension-polyfill'
import { storage } from './storage'

/**
 * Check if notification permission is granted
 */
export function isNotificationPermissionGranted(): boolean {
  return Notification.permission === 'granted'
}

/**
 * Request notification permission from the user
 * @returns Promise<boolean> - true if permission granted, false otherwise
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (isNotificationPermissionGranted()) {
    return true
  }

  try {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  } catch (error) {
    console.error('Failed to request notification permission:', error)
    return false
  }
}

/**
 * Show a browser notification
 * @param title - Notification title
 * @param options - Optional notification options
 */
export async function showNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (!isNotificationPermissionGranted()) {
    console.warn('Notification permission not granted')
    return
  }

  try {
    const notification = new Notification(title, {
      icon: browser.runtime.getURL('icons/icon-128.png'),
      badge: browser.runtime.getURL('icons/icon-48.png'),
      ...options,
    })

    // Handle notification click to focus the browser window
    notification.onclick = () => {
      // Focus or open the extension
      browser.tabs
        .query({ active: true, currentWindow: true })
        .then(tabs => {
          if (tabs[0]?.id) {
            browser.tabs.update(tabs[0].id, { active: true })
          }
        })
        .catch(error => {
          console.error('Failed to focus tab:', error)
        })
      notification.close()
    }
  } catch (error) {
    console.error('Failed to show notification:', error)
  }
}

/**
 * Check if a torrent has already been notified
 * @param torrentId - The torrent ID to check
 * @returns Promise<boolean> - true if already notified
 */
async function isTorrentNotified(torrentId: string): Promise<boolean> {
  const notificationState = await storage.getNotificationState()
  return notificationState.notifiedTorrentIds.includes(torrentId)
}

/**
 * Mark a torrent as notified
 * @param torrentId - The torrent ID to mark
 */
async function markTorrentAsNotified(torrentId: string): Promise<void> {
  const notificationState = await storage.getNotificationState()
  notificationState.notifiedTorrentIds.push(torrentId)
  notificationState.lastNotificationTime = Date.now()
  await storage.saveNotificationState(notificationState)
}

/**
 * Show a notification when a torrent completes
 * @param torrentName - The name of the completed torrent
 * @param linkCount - Number of download links available
 */
export async function showTorrentCompleteNotification(
  torrentName: string,
  linkCount: number
): Promise<void> {
  const dashboardSettings = await storage.getDashboardSettings()

  // Check if notifications are enabled in settings
  if (!dashboardSettings.notificationsEnabled) {
    return
  }

  await showNotification('Torrent Completed', {
    body: `${torrentName}${linkCount > 0 ? ` (${linkCount} link${linkCount > 1 ? 's' : ''})` : ''}`,
    tag: 'torrent-complete',
  })
}

/**
 * Show a batch notification when multiple torrents complete
 * @param completedCount - Number of completed torrents
 * @param failedCount - Number of failed torrents
 */
export async function showBatchCompleteNotification(
  completedCount: number,
  failedCount: number
): Promise<void> {
  const dashboardSettings = await storage.getDashboardSettings()

  // Check if notifications are enabled in settings
  if (!dashboardSettings.notificationsEnabled) {
    return
  }

  let body = ''
  if (completedCount > 0 && failedCount > 0) {
    body = `${completedCount} completed, ${failedCount} failed`
  } else if (completedCount > 0) {
    body = `${completedCount} torrent${completedCount > 1 ? 's' : ''} completed`
  } else if (failedCount > 0) {
    body = `${failedCount} torrent${failedCount > 1 ? 's' : ''} failed`
  }

  if (body) {
    await showNotification('Batch Update', {
      body,
      tag: 'batch-complete',
    })
  }
}

/**
 * Show a notification when a torrent fails
 * @param torrentName - The name of the failed torrent
 */
export async function showTorrentErrorNotification(torrentName: string): Promise<void> {
  const dashboardSettings = await storage.getDashboardSettings()

  // Check if notifications are enabled in settings
  if (!dashboardSettings.notificationsEnabled) {
    return
  }

  await showNotification('Torrent Failed', {
    body: `${torrentName} failed to convert`,
    tag: 'torrent-error',
  })
}

/**
 * Notify when a torrent status changes to ready or error
 * @param torrentId - The torrent ID
 * @param torrentName - The torrent name
 * @param status - The new status
 * @param linkCount - Number of links (for completed torrents)
 */
export async function notifyTorrentStatusChange(
  torrentId: string,
  torrentName: string,
  status: string,
  linkCount: number = 0
): Promise<void> {
  // Check if already notified
  const alreadyNotified = await isTorrentNotified(torrentId)
  if (alreadyNotified) {
    return
  }

  // Show notification based on status
  if (status === 'ready') {
    await showTorrentCompleteNotification(torrentName, linkCount)
    await markTorrentAsNotified(torrentId)
  } else if (status === 'error' || status === 'timeout') {
    await showTorrentErrorNotification(torrentName)
    await markTorrentAsNotified(torrentId)
  }
}

/**
 * Clear notification state for completed torrents
 * Useful when clearing completed torrents from the dashboard
 */
export async function clearCompletedNotifications(torrentIds: string[]): Promise<void> {
  const notificationState = await storage.getNotificationState()
  notificationState.notifiedTorrentIds = notificationState.notifiedTorrentIds.filter(
    id => !torrentIds.includes(id)
  )
  await storage.saveNotificationState(notificationState)
}

/**
 * Reset all notification state
 * Useful when clearing all torrents
 */
export async function resetNotificationState(): Promise<void> {
  await storage.saveNotificationState({
    notifiedTorrentIds: [],
    lastNotificationTime: 0,
  })
}
