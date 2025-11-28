import { Module } from '@nestjs/common';
import { NotificationModule } from './notification/notification.module';
import { ContactModule } from './contact/contact.module';
import { FaqModule } from './faq/faq.module';
import { MoviesModule } from './movies/movies.module';
import { MediaModule } from './media/media.module';
import { StreamModule } from './stream/stream.module';
import { FavouriteModule } from './favourite/favourite.module';


@Module({
  imports: [NotificationModule, ContactModule, FaqModule, MoviesModule, MediaModule, StreamModule, FavouriteModule],
})
export class ApplicationModule {}
