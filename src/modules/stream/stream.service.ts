import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class StreamService {
  private BASE_URL = 'http://i3o6s5.kwikwi.top/player_api.php';
  private USERNAME = 'iosapptest';
  private PASSWORD = 'gNmh6QdR2FFQxcBU';

  /**
   * Constructs the base API URL with credentials and an optional extra query string.
   * @param extra Additional query parameters (e.g., '&action=...')
   */
  private buildUrl(extra = '') {
    return `${this.BASE_URL}?username=${this.USERNAME}&password=${this.PASSWORD}${extra}`;
  }

  /**
   * Implements client-side pagination for API responses.
   * @param data The full array of data to paginate.
   * @param page The current page number (1-based).
   * @param perPage The number of items per page.
   */
  private paginate(data: any[], page: number, perPage: number) {
    const start = (page - 1) * perPage;
    const end = start + perPage;
    return data.slice(start, end);
  }

  // ----------------- LIVE TV -----------------

  async getLiveCategories(page: number, perPage: number) {
    const { data } = await axios.get(this.buildUrl('&action=get_live_categories'));

    if (!Array.isArray(data)) {
      return [];
    }

    return this.paginate(data, page, perPage);
  }

  async getLiveStreams(page: number, perPage: number) {
    const { data } = await axios.get(this.buildUrl('&action=get_live_streams'));

    if (!Array.isArray(data)) {
      return [];
    }

    // Map streams and construct the live stream URL
    const streams = data.map((stream) => ({
      num: stream.num,
      name: stream.name,
      stream_type: stream.stream_type,
      stream_id: stream.stream_id,
      stream_icon: stream.stream_icon,
      added: stream.added,
      category_id: stream.category_id,
      container_extension: stream.container_extension,
      // Live streams typically use the 'live' path and the stream_id directly
      stream_url: `http://i3o6s5.kwikwi.top/live/${this.USERNAME}/${this.PASSWORD}/${stream.stream_id}`,
    }));

    return this.paginate(streams, page, perPage);
  }

  async getLiveStreamsByCategory(
    categoryId: string,
    page: number,
    perPage: number,
  ) {
    // Note: The API is assumed to support filtering streams by category_id directly in the URL
    const { data } = await axios.get(
      this.buildUrl(`&action=get_live_streams&category_id=${categoryId}`),
    );

    if (!Array.isArray(data)) {
      return [];
    }

    const streams = data.map((stream) => ({
      num: stream.num,
      name: stream.name,
      stream_type: stream.stream_type,
      stream_id: stream.stream_id,
      stream_icon: stream.stream_icon,
      added: stream.added,
      category_id: stream.category_id,
      container_extension: stream.container_extension,
      stream_url: `http://i3o6s5.kwikwi.top/live/${this.USERNAME}/${this.PASSWORD}/${stream.stream_id}`,
    }));

    return this.paginate(streams, page, perPage);
  }

  // ----------------- VOD -----------------
  async getVodCategories(page: number, perPage: number) {
    const { data } = await axios.get(
      this.buildUrl('&action=get_vod_categories'),
    );

    if (!Array.isArray(data)) {
      return [];
    }

    return this.paginate(data, page, perPage);
  }

  async getVodMovies(page: number, perPage: number) {
    const { data } = await axios.get(this.buildUrl('&action=get_vod_streams'));

    if (!Array.isArray(data)) {
      return [];
    }

    // Construct the VOD stream URL including container extension
    return this.paginate(
      data.map((movie) => ({
        num: movie.num,
        name: movie.name,
        stream_type: movie.stream_type,
        stream_id: movie.stream_id,
        stream_icon: movie.stream_icon,
        added: movie.added,
        category_id: movie.category_id,
        container_extension: movie.container_extension,
        stream_url: `http://i3o6s5.kwikwi.top/play/${this.USERNAME}/${this.PASSWORD}/${movie.stream_id}.${movie.container_extension}`,
      })),
      page,
      perPage,
    );
  }

  async getVodMoviesByCategory(
    categoryId: string,
    page: number,
    perPage: number,
  ) {
    // Note: The API is assumed to support filtering movies by category_id directly in the URL
    const { data } = await axios.get(
      this.buildUrl(`&action=get_vod_streams&category_id=${categoryId}`),
    );

    if (!Array.isArray(data)) {
      return [];
    }

    const streams = data.map((s) => ({
      ...s,
      stream_url: `http://i3o6s5.kwikwi.top/play/${this.USERNAME}/${this.PASSWORD}/${s.stream_id}.${s.container_extension}`,
    }));

    return this.paginate(streams, page, perPage);
  }











  
}