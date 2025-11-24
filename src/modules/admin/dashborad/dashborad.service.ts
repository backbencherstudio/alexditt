import { Injectable } from '@nestjs/common';
import { CreateDashboradDto } from './dto/create-dashborad.dto';
import { UpdateDashboradDto } from './dto/update-dashborad.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DashboradService {
  
    constructor(private prisma: PrismaService) {}

    //a-dmin dashborad total user,videos,deatils
    async getDashboardData() {
        
        const [totalUsers, totalMovies, totalSeries, recentUsers] = await Promise.all([
           
            this.prisma.user.count({ where: { deleted_at: null } }),

            this.prisma.movie.count(),

            this.prisma.series.count(),

  
            this.prisma.user.findMany({
                where: {
                    deleted_at: null,
                },
                select: {
                    name: true,
                    email: true,
                    created_at: true,
                    status: true,
                },
                orderBy: {
                    created_at: 'desc',
                },
                take: 10, 
            }),
        ]);

        // Calculate Total Videos (Movies + Series)
        const totalVideos = totalMovies + totalSeries;

        // Format the recent users data to match the dashboard image
        const formattedRecentUsers = recentUsers.map(user => ({
            name: user.name,
            email: user.email,
            // Format date to match "Apr 12, 2025" style
            created_at:user.created_at,
            // Map integer status to string label
            status: user.status,
        }));

        return {
            message: 'Dashboard data fetched successfully',
            data: {
                // Summary Counts
                total_users: totalUsers,
                total_videos: totalVideos, // Note: The image shows "$8.2K" which might imply revenue, but based on your models, I assumed total content count.
                
                // Detailed List
                user_details: formattedRecentUsers,
            },
        };
    }
}