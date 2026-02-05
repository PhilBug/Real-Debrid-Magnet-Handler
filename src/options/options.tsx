import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { storage } from '../utils/storage'
import { rdAPI } from '../utils/realdebrid-api'
import '../styles/main.css'

function Options() {
  const [apiToken, setApiToken] = useState('')
  const [maxListSize, setMaxListSize] = useState(10)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    const settings = await storage.getSettings()
    setApiToken(settings.apiToken || '')
    setMaxListSize(settings.maxListSize)
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
      })

      setMessage('Settings saved successfully!')
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-w-[500px] max-w-2xl mx-auto p-8 bg-white">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Settings</h1>

      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label htmlFor="apiToken" className="block text-sm font-medium mb-2 text-gray-700">
            Real-Debrid API Token
          </label>
          <input
            id="apiToken"
            type="password"
            value={apiToken}
            onChange={e => setApiToken(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your API token"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Get your token at:{' '}
            <a
              href="https://real-debrid.com/apitoken"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-700"
            >
              https://real-debrid.com/apitoken
            </a>
          </p>
        </div>

        <div>
          <label htmlFor="maxListSize" className="block text-sm font-medium mb-2 text-gray-700">
            Maximum List Size
          </label>
          <input
            id="maxListSize"
            type="number"
            value={maxListSize}
            onChange={e => setMaxListSize(parseInt(e.target.value) || 10)}
            min="5"
            max="50"
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Number of torrents to keep in the list (5-50)
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 text-white p-3 rounded font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>

        {message && (
          <div
            className={`p-3 rounded ${
              message.startsWith('Error')
                ? 'bg-red-100 text-red-700 border border-red-300'
                : 'bg-green-100 text-green-700 border border-green-300'
            }`}
          >
            {message}
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
