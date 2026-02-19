/**
 * Options Page - Real-Debrid Magnet Handler
 *
 * Settings page for configuring the extension using the
 * Industrial Terminal design system.
 */

import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { storage } from '../utils/storage'
import { rdAPI } from '../utils/realdebrid-api'
import { Button } from '../components/common/Button'
import { Input } from '../components/common/Input'
import { Icon } from '../components/common/Icon'
import './options.css'

/**
 * Options component for managing extension settings.
 */
function Options() {
  const [apiToken, setApiToken] = useState('')
  const [maxListSize, setMaxListSize] = useState(10)
  const [contextMenuEnabled, setContextMenuEnabled] = useState(false)
  const [alwaysSaveAllFiles, setAlwaysSaveAllFiles] = useState(false)
  const [visibleTorrentsCount, setVisibleTorrentsCount] = useState(5)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [showToken, setShowToken] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const settings = await storage.getSettings()
    setApiToken(settings.apiToken || '')
    setMaxListSize(settings.maxListSize)
    setContextMenuEnabled(settings.contextMenuEnabled)
    setAlwaysSaveAllFiles(settings.alwaysSaveAllFiles)
    setVisibleTorrentsCount(settings.visibleTorrentsCount)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      // Test API token
      const isValid = await rdAPI.validateToken(apiToken)

      if (!isValid) {
        setMessage('Error: Invalid API token. Please check and try again.')
        return
      }

      // Save settings
      await storage.saveSettings({
        apiToken,
        maxListSize,
        contextMenuEnabled,
        alwaysSaveAllFiles,
        visibleTorrentsCount,
      })

      setMessage('Settings saved successfully!')
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    loadSettings()
    setMessage('')
  }

  return (
    <div className="options">
      <header className="options__header">
        <span className="options__prompt">rd://</span>
        <h1 className="options__title">REAL-DEBRID HANDLER - Settings</h1>
      </header>

      <form onSubmit={handleSave}>
        {/* API Configuration Section */}
        <section className="options__section">
          <h2 className="options__section-title">API Configuration</h2>

          <div className="options__input-group">
            <div className="options__token-input-wrapper">
              <Input
                id="apiToken"
                type={showToken ? 'text' : 'password'}
                label="API Token"
                value={apiToken}
                onChange={e => setApiToken(e.target.value)}
                placeholder="Enter your API token"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => setShowToken(!showToken)}
                aria-label={showToken ? 'Hide token' : 'Show token'}
              >
                <Icon name={showToken ? 'x' : 'check-circle'} size="sm" />
              </Button>
            </div>
            <div className="options__helper-text">
              Get your API token from:{' '}
              <a
                href="https://real-debrid.com/apitoken"
                target="_blank"
                rel="noopener noreferrer"
                className="options__external-link"
              >
                https://real-debrid.com/apitoken
                <Icon name="external-link" size="sm" aria-label="Opens in new tab" />
              </a>
            </div>
          </div>
        </section>

        {/* Preferences Section */}
        <section className="options__section">
          <h2 className="options__section-title">Preferences</h2>

          <div className="options__input-group">
            <Input
              id="maxListSize"
              type="number"
              label="Max items in list"
              value={maxListSize}
              onChange={e => setMaxListSize(parseInt(e.target.value) || 10)}
              min="5"
              max="50"
              helperText="Number of torrents to keep in the list (5-50)"
            />
          </div>

          <div className="options__input-group">
            <label className="options__select-label" htmlFor="visibleTorrentsCount">
              Visible torrents in popup
            </label>
            <select
              id="visibleTorrentsCount"
              className="options__select"
              value={visibleTorrentsCount}
              onChange={e => setVisibleTorrentsCount(parseInt(e.target.value))}
            >
              <option value={3}>3 torrents</option>
              <option value={5}>5 torrents</option>
              <option value={7}>7 torrents</option>
              <option value={10}>10 torrents</option>
            </select>
            <div className="options__helper-text">
              Number of torrents visible by default in the popup before scrolling
            </div>
          </div>

          <div className="options__input-group">
            <label className="options__checkbox">
              <input
                type="checkbox"
                checked={contextMenuEnabled}
                onChange={e => setContextMenuEnabled(e.target.checked)}
                className="options__checkbox-input"
              />
              <div>
                <span className="options__checkbox-label">Enable context menu integration</span>
                <span className="options__checkbox-description">
                  Add "Send to Real-Debrid" option when right-clicking magnet links
                </span>
              </div>
            </label>
          </div>

          <div className="options__input-group">
            <label className="options__checkbox">
              <input
                type="checkbox"
                checked={alwaysSaveAllFiles}
                onChange={e => setAlwaysSaveAllFiles(e.target.checked)}
                className="options__checkbox-input"
              />
              <div>
                <span className="options__checkbox-label">Always save all files automatically</span>
                <span className="options__checkbox-description">
                  Automatically select all files in multi-file torrents (skip file selection UI)
                </span>
              </div>
            </label>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="options__button-group">
          <Button type="button" variant="secondary" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            Save Changes
          </Button>
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`options__message ${
              message.startsWith('Error') ? 'options__message--error' : 'options__message--success'
            }`}
          >
            <Icon name={message.startsWith('Error') ? 'x-circle' : 'check-circle'} size="sm" />
            <span>{message}</span>
          </div>
        )}
      </form>
    </div>
  )
}

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(<Options />)
}

export default Options
