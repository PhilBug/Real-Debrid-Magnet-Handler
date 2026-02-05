import axios, { type AxiosInstance } from 'axios'
import { storage } from './storage'
import type { RdTorrentAddedResponse, RdTorrentInfo, RdUnrestrictLinkResponse } from './types'

class RealDebridAPI {
  private client: AxiosInstance
  private baseURL = 'https://api.real-debrid.com/rest/1.0'

  constructor() {
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  private async ensureAuth(): Promise<void> {
    const settings = await storage.getSettings()
    if (!settings.apiToken) throw new Error('NO_TOKEN')
    this.client.defaults.headers.common['Authorization'] = `Bearer ${settings.apiToken}`
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      await axios.get(`${this.baseURL}/user`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return true
    } catch {
      return false
    }
  }

  async addMagnet(magnetLink: string): Promise<RdTorrentAddedResponse> {
    await this.ensureAuth()
    const params = new URLSearchParams()
    params.append('magnet', magnetLink)
    const response = await this.client.post<RdTorrentAddedResponse>('/torrents/addMagnet', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    return response.data
  }

  async getTorrentInfo(torrentId: string): Promise<RdTorrentInfo> {
    await this.ensureAuth()
    const response = await this.client.get<RdTorrentInfo>(`/torrents/info/${torrentId}`)
    return response.data
  }

  async selectFiles(torrentId: string, files = 'all'): Promise<void> {
    await this.ensureAuth()
    const params = new URLSearchParams()
    params.append('files', files)
    await this.client.post(`/torrents/selectFiles/${torrentId}`, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  }

  async deleteTorrent(torrentId: string): Promise<void> {
    await this.ensureAuth()
    await this.client.delete(`/torrents/delete/${torrentId}`)
  }

  async unrestrictLink(link: string): Promise<RdUnrestrictLinkResponse> {
    await this.ensureAuth()
    const params = new URLSearchParams()
    params.append('link', link)

    const response = await this.client.post<RdUnrestrictLinkResponse>('/unrestrict/link', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    return response.data
  }
}

export const rdAPI = new RealDebridAPI()
