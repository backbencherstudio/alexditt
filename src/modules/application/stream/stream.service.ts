import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import axios from 'axios';
import appConfig from 'src/config/app.config';

@Injectable()
export class StreamService {
  private baseUrl: string;
  private serverUrl: string;
  private username: string;
  private password: string;

  private tmdbApiKey: string;
  private tmdbBaseUrl: string;
  private tmdbImageBase: string;

  constructor() {
    const config = appConfig();

    this.baseUrl = config.iptv.baseUrl;
    this.serverUrl = config.iptv.serverUrl;
    this.username = config.iptv.username;
    this.password = config.iptv.password;

    this.tmdbApiKey = config.tmdb.apiKey;
    this.tmdbBaseUrl = config.tmdb.baseUrl;
    this.tmdbImageBase = 'https://image.tmdb.org/t/p/original';

    if (!this.baseUrl || !this.username || !this.password) {
      throw new Error('IPTV configuration missing in appConfig');
    }

    if (!this.tmdbApiKey) {
      throw new Error('TMDB API key missing');
    }
  }

  // -----------------------------------------
  // TMDB Helper
  // -----------------------------------------
  private async fetchTMDB(endpoint: string, params: any = {}) {
    const url = `${this.tmdbBaseUrl}${endpoint}`;

    try {
      const response = await axios.get(url, {
        params: {
          api_key: this.tmdbApiKey,
          ...params,
        },
      });

      return response.data;
    } catch (error) {
      console.error('TMDB Fetch Error:', error.message);
      return null;
    }
  }

  // -----------------------------------------
  // IPTV Authentication
  // -----------------------------------------
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

  // -----------------------------------------
  // LIVE TV
  // -----------------------------------------
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

  async getStreamsByCategory(categoryId: string) {
    try {
      const url = `${this.baseUrl}?username=${this.username}&password=${this.password}&action=get_live_streams&category_id=${categoryId}`;
      const response = await axios.get(url);

      const data = response.data;
      if (!Array.isArray(data)) return [];

      return data.map((stream) => ({
        num: stream.num,
        name: stream.name,
        stream_type: stream.stream_type,
        stream_id: stream.stream_id,
        stream_icon: stream.stream_icon,
        epg_channel_id: stream.epg_channel_id,
        added: stream.added,
        category_id: stream.category_id,

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

  // -----------------------------------------
  // *MOVIES (VOD)
  // -----------------------------------------
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

  async getMoviesByCategory(categoryId: string) {
    try {
      const url = `${this.baseUrl}?username=${this.username}&password=${this.password}&action=get_vod_streams&category_id=${categoryId}`;
      const response = await axios.get(url);

      const data = response.data;
      if (!Array.isArray(data)) return [];

      // Process movie data + TMDB fetch
      const movies = await Promise.all(
        data.map(async (movie) => {
          let tmdbInfo = null;

          // TMDB ID sometimes included in IPTV data
          const tmdbId = movie.tmdb || movie.tmdb_id || null;

          if (tmdbId) {
            tmdbInfo = await this.fetchTMDB(`/movie/${tmdbId}`, {
              append_to_response: 'videos,images,credits',
            });
          }

          return {
            // IPTV info
            num: movie.num,
            name: movie.name,
            stream_type: movie.stream_type,
            stream_id: movie.stream_id,
            stream_icon: movie.stream_icon,
            rating: movie.rating,
            added: movie.added,
            category_id: movie.category_id,
            container_extension: movie.container_extension,

            play_url: `${this.serverUrl}/movie/${this.username}/${this.password}/${movie.stream_id}.${movie.container_extension}`,

            // TMDB Info (if found)
            tmdb: tmdbInfo
              ? {
                  id: tmdbInfo.id,
                  title: tmdbInfo.title,
                  overview: tmdbInfo.overview,
                  rating: tmdbInfo.vote_average,
                  genres: tmdbInfo.genres,

                  poster: tmdbInfo.poster_path
                    ? `${this.tmdbImageBase}${tmdbInfo.poster_path}`
                    : null,

                  backdrop: tmdbInfo.backdrop_path
                    ? `${this.tmdbImageBase}${tmdbInfo.backdrop_path}`
                    : null,

                  release_date: tmdbInfo.release_date,

                  cast:
                    tmdbInfo.credits?.cast?.slice(0, 15).map((actor) => ({
                      id: actor.id,
                      name: actor.name,
                      character: actor.character,
                      profile: actor.profile_path
                        ? `${this.tmdbImageBase}${actor.profile_path}`
                        : null,
                    })) || [],
                }
              : null,
          };
        }),
      );

      return movies;
    } catch (error) {
      console.error(`Movie Fetch Error (Cat: ${categoryId}):`, error.message);
      throw new HttpException(
        'Failed to fetch movies.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // -----------------------------------------
  // *SERIES
  // -----------------------------------------

  // * get Series Categories
  async getSeriesCategories() {
    try {
      const url = `${this.baseUrl}?username=${this.username}&password=${this.password}&action=get_series_categories`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Series Category Fetch Error:', error.message);
      throw new HttpException(
        'Failed to fetch series categories.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // * get Series by Category ID
  async getSeries(categoryId?: string) {
    try {
      let url = `${this.baseUrl}?username=${this.username}&password=${this.password}&action=get_series`;
      if (categoryId) url += `&category_id=${categoryId}`;

      const response = await axios.get(url);
      const data = response.data;

      console.log('Series Data:', data);

      if (!Array.isArray(data)) return [];

      return data.map((series) => ({
        num: series.num,
        series_id: series.series_id,
        name: series.name,
        cover: series.cover,
        plot: series.plot,
        cast: series.cast,
        director: series.director,
        genre: series.genre,
        release_date: series.release_date,
        rating: series.rating,
        rating_5based: series.rating_5based,
        episode_run_time: series.episode_run_time,
        category_id: series.category_id,
        backdrop_path: series.backdrop_path,
        youtube_trailer: series.youtube_trailer,
        tmdb_id: series.tmdb_id,
      }));
    } catch (error) {
      console.error(`Series Fetch Error (Cat: ${categoryId}):`, error.message);
      throw new HttpException(
        'Failed to fetch series.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // * get All Series
  async getSeriesInfo(seriesId: string) {
    try {
      const url = `${this.baseUrl}?username=${this.username}&password=${this.password}&action=get_series_info&series_id=${seriesId}`;
      const response = await axios.get(url);

      const data = response.data;
      if (!data || !data.episodes) return {};

      const tmdbId = data.info?.tmdb || null;

      let tmdbInfo = null;
      if (tmdbId) {
        tmdbInfo = await this.fetchTMDB(`/tv/${tmdbId}`, {
          append_to_response: 'images,videos,credits',
        });
      }

      const formattedEpisodes = [];
      Object.keys(data.episodes).forEach((seasonNumber) => {
        data.episodes[seasonNumber].forEach((ep) => {
          const ext = ep.container_extension || 'mp4';

          formattedEpisodes.push({
            season: Number(seasonNumber),
            episode_id: ep.id,
            title: ep.title,
            container_extension: ext,
            stream_url: `${this.serverUrl}/series/${this.username}/${this.password}/${ep.id}.${ext}`,
          });
        });
      });

      return {
        series_id: seriesId,
        tmdb_id: tmdbId,
        iptv_info: data.info,

        tmdb: tmdbInfo
          ? {
              id: tmdbInfo.id,
              name: tmdbInfo.name,
              overview: tmdbInfo.overview,

              poster: tmdbInfo.poster_path
                ? `${this.tmdbImageBase}${tmdbInfo.poster_path}`
                : null,

              backdrop: tmdbInfo.backdrop_path
                ? `${this.tmdbImageBase}${tmdbInfo.backdrop_path}`
                : null,

              rating: tmdbInfo.vote_average,
              genres: tmdbInfo.genres,

              cast:
                tmdbInfo.credits?.cast?.map((actor) => ({
                  id: actor.id,
                  name: actor.name,
                  character: actor.character,
                  profile: actor.profile_path
                    ? `${this.tmdbImageBase}${actor.profile_path}`
                    : null,
                })) || [],
            }
          : null,

        total_seasons: Object.keys(data.episodes).length,
        episodes: formattedEpisodes,
      };
    } catch (error) {
      console.error(
        `Series Info Fetch Error (ID: ${seriesId}):`,
        error.message,
      );
      throw new HttpException(
        'Failed to fetch series info.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
