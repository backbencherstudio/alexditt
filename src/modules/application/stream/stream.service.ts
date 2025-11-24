import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateStreamDto } from './dto/create-stream.dto';
import { UpdateStreamDto } from './dto/update-stream.dto';
import appConfig from 'src/config/app.config';
import axios from 'axios';

@Injectable()
export class StreamService {
  private baseUrl: string;
  private serverUrl: string;
  private username: string;
  private password: string;

  constructor() {
    const config = appConfig();

    this.baseUrl = config.iptv.baseUrl;
    this.serverUrl = config.iptv.serverUrl;
    this.username = config.iptv.username;
    this.password = config.iptv.password;

    if (!this.baseUrl || !this.username || !this.password) {
      throw new Error('IPTV configuration missing in appConfig');
    }
  }

  /**
   * 1. Authentication Check
   */
  async checkAuthentication() {
    try {
      const url = `${this.baseUrl}?username=${this.username}&password=${this.password}`;
      const response = await axios.get(url);

      if (!response.data.user_info) {
        throw new Error('Invalid credentials or server error');
      }

      return response.data;
    } catch (error) {
      console.error('IPTV Auth Error:', error.message);
      throw new HttpException(
        'Failed to connect to IPTV server.',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * 2. Get All Live Categories
   */
  async getCategories() {
    try {
      const url = `${this.baseUrl}?username=${this.username}&password=${this.password}&action=get_live_categories`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Category Fetch Error:', error.message);
      throw new HttpException(
        'Failed to fetch categories.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 3. Get Streams by Category ID
   */
  async getStreamsByCategory(categoryId: string) {
    try {
      const url = `${this.baseUrl}?username=${this.username}&password=${this.password}&action=get_live_streams&category_id=${categoryId}`;
      const response = await axios.get(url);

      const data = response.data;

      if (!Array.isArray(data)) {
        return [];
      }

      return data.map((stream) => ({
        num: stream.num,
        name: stream.name,
        stream_type: stream.stream_type,
        stream_id: stream.stream_id,
        stream_icon: stream.stream_icon,
        epg_channel_id: stream.epg_channel_id,
        added: stream.added,
        category_id: stream.category_id,

        // HLS Play URL
        play_url: `${this.serverUrl}/live/${this.username}/${this.password}/${stream.stream_id}.m3u8`,
      }));
    } catch (error) {
      console.error(`Stream Fetch Error (Cat: ${categoryId}):`, error.message);
      throw new HttpException(
        'Failed to fetch streams.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 5. Get Movie (VOD) Categories
   * Action: get_vod_categories
   */
  async getMovieCategories() {
    try {
      const url = `${this.baseUrl}?username=${this.username}&password=${this.password}&action=get_vod_categories`;

      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Movie Category Fetch Error:', error.message);
      throw new HttpException(
        'Failed to fetch movie categories.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 4. Get Movies by Category ID
   * Action: get_vod_streams
   */
  async getMoviesByCategory(categoryId: string) {
    try {
      const url = `${this.baseUrl}?username=${this.username}&password=${this.password}&action=get_vod_streams&category_id=${categoryId}`;

      const response = await axios.get(url);
      const data = response.data;

      if (!Array.isArray(data)) {
        return [];
      }

      return data.map((movie) => ({
        num: movie.num,
        name: movie.name,
        stream_type: movie.stream_type,
        stream_id: movie.stream_id,
        stream_icon: movie.stream_icon,
        rating: movie.rating,
        added: movie.added,
        category_id: movie.category_id,
        container_extension: movie.container_extension,

        // Movie Play URL Generation
        // formet: http://server/movie/user/pass/id.extension
        play_url: `${this.serverUrl}/movie/${this.username}/${this.password}/${movie.stream_id}.${movie.container_extension}`,
      }));
    } catch (error) {
      console.error(`Movie Fetch Error (Cat: ${categoryId}):`, error.message);
      throw new HttpException(
        'Failed to fetch movies.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
